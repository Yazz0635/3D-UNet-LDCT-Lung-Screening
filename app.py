import io
import base64
import tempfile
import os
import torch
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from monai.networks.nets import UNet
from monai.transforms import Compose, LoadImaged, EnsureChannelFirstd, Resized, ScaleIntensityd, ToTensord

# --- 1. SETUP API & CORS ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. LOAD AI MODEL ---
MODEL_PATH = "production_best_3d_unet.pth"
device = torch.device("cpu") 
model = UNet(
    spatial_dims=3, in_channels=1, out_channels=1,
    channels=(16, 32, 64, 128), strides=(2, 2, 2)
).to(device)

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
else:
    print(f"❌ ERROR: Model '{MODEL_PATH}' not found!")

# --- 3. PROCESSING FUNCTION ---
def process_scan(file_path):
    transforms = Compose([
        LoadImaged(keys=["image"]),
        EnsureChannelFirstd(keys=["image"]),
        ScaleIntensityd(keys=["image"]),
        Resized(keys=["image"], spatial_size=(96, 96, 96), mode="trilinear"), 
        ToTensord(keys=["image"])
    ])
    data = transforms({"image": file_path})
    return data["image"].unsqueeze(0), data["image"][0].numpy()

# --- 4. THE API ENDPOINT ---
@app.post("/predict")
async def predict_tumor(
    file: UploadFile = File(...), 
    slice_idx: int = Form(-1) # Listens to the frontend slider
):
    # 1. Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 2. Run AI Inference
        input_tensor, original_volume = process_scan(tmp_path)
        with torch.no_grad():
            output = model(input_tensor.to(device))
            raw_prob_mask = torch.sigmoid(output).squeeze().cpu().numpy()
            pred_mask = (raw_prob_mask > 0.30).astype(np.uint8)

        # --- THE SLIDER LOGIC ---
        tumor_pixels_per_slice = [np.sum(pred_mask[:, :, z]) for z in range(96)]
        
        if slice_idx == -1:
            # First upload: Auto-detect the slice with the biggest tumor
            target_slice = int(np.argmax(tumor_pixels_per_slice))
            if np.sum(pred_mask[:, :, target_slice]) == 0:
                target_slice = 48 # Default to middle if healthy
        else:
            # Slider moved: Show the exact slice the frontend asked for
            target_slice = slice_idx

        # Calculate diagnostics ONLY for the current slice
        pixel_count = int(np.sum(pred_mask[:, :, target_slice]))

        # --- DRAWING ---
        slice_binary = pred_mask[:, :, target_slice]
        mask_slice_T = slice_binary.T
        
        fig, ax = plt.subplots(facecolor='black', figsize=(6, 6))
        ax.imshow(original_volume[:, :, target_slice].T, cmap="gray", origin="lower")
        
        mask_rgba = np.zeros(mask_slice_T.shape + (4,)) 
        mask_rgba[..., 0] = 1.0 
        mask_rgba[..., 3] = np.where(mask_slice_T > 0, 0.6, 0) 
        ax.imshow(mask_rgba, origin="lower")
        
        if pixel_count > 10:
            y_indices, x_indices = np.where(mask_slice_T > 0)
            x_min, x_max = x_indices.min(), x_indices.max()
            y_min, y_max = y_indices.min(), y_indices.max()
            padding = 3
            width = (x_max - x_min) + (padding * 2)
            height = (y_max - y_min) + (padding * 2)
            
            rect = patches.Rectangle(
                (x_min - padding, y_min - padding), 
                width, height, 
                linewidth=2, edgecolor='yellow', facecolor='none'
            )
            ax.add_patch(rect)
            
        ax.axis("off")

        # 5. Convert Plot to Web-Safe Image (Base64)
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode("utf-8")

        confidence = float(np.max(raw_prob_mask[:, :, target_slice][slice_binary > 0])) * 100 if pixel_count > 10 else 0.0

        return JSONResponse({
            "status": "success",
            "slice_index": target_slice,
            "tumor_detected": pixel_count > 10,
            "confidence": round(confidence, 1),
            "pixel_size": pixel_count,
            "image_data": f"data:image/png;base64,{img_base64}"
        })

    finally:
        os.unlink(tmp_path) # Clean up temp file