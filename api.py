# api.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
import os
import shutil
import base64
from monai.networks.nets import UNet
from monai.transforms import Compose, LoadImaged, EnsureChannelFirstd, Resized, ScaleIntensityd, ToTensord

app = FastAPI(title="RPD AI PyTorch Backend")

# Enable CORS for React Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device("cpu")
MODEL_PATH = "production_best_3d_unet.pth"

# Load Model once globally
model = UNet(
    spatial_dims=3, in_channels=1, out_channels=1,
    channels=(16, 32, 64, 128), strides=(2, 2, 2)
).to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

def load_and_process_scan(scan_path):
    transforms = Compose([
        LoadImaged(keys=["image"]),
        EnsureChannelFirstd(keys=["image"]),
        ScaleIntensityd(keys=["image"]),
        Resized(keys=["image"], spatial_size=(96, 96, 96), mode="trilinear"), 
        ToTensord(keys=["image"])
    ])
    data = transforms({"image": scan_path})
    input_tensor = data["image"].unsqueeze(0) 
    
    # original_volume: array of shape (96, 96, 96) meaning (X, Y, Z)
    original_volume = data["image"][0].numpy() 
    return input_tensor, original_volume

@app.post("/api/infer")
async def infer(file: UploadFile = File(...)):
    # 1. Save uploaded file to temp directory
    os.makedirs("temp", exist_ok=True)
    temp_path = os.path.join("temp", file.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. PyTorch Inference
        input_tensor, original_volume = load_and_process_scan(temp_path)
        
        with torch.no_grad():
            output = model(input_tensor.to(DEVICE))
            raw_prob_mask = torch.sigmoid(output).squeeze().cpu().numpy()
            
        # 3. Format Data for Frontend
        # Convert shapes from (X, Y, Z) into (Z, Y, X) for fast browser slicing
        vol_zyx = np.transpose(original_volume, (2, 1, 0))
        vol_uint8 = (vol_zyx * 255.0).clip(0, 255).astype(np.uint8)
        
        prob_zyx = np.transpose(raw_prob_mask, (2, 1, 0))
        prob_uint8 = (prob_zyx * 100.0).clip(0, 100).astype(np.uint8)
        
        # Pre-compute bounding boxes per slice
        bounding_boxes = []
        for z in range(96):
            slice_prob = prob_zyx[z]
            slice_binary = slice_prob > 5 # Minimum initial detection threshold (5%)
            
            boxes_for_slice = []
            if np.sum(slice_binary) > 0:
                y_indices, x_indices = np.where(slice_binary)
                x_min, x_max = int(x_indices.min()), int(x_indices.max())
                y_min, y_max = int(y_indices.min()), int(y_indices.max())
                max_conf = float(np.max(slice_prob[slice_binary]))
                
                # Add padding like Streamlit did
                pad = 3
                boxes_for_slice.append({
                    "x": max(0, x_min - pad),
                    "y": max(0, y_min - pad),
                    "width": (x_max - x_min) + (pad * 2),
                    "height": (y_max - y_min) + (pad * 2),
                    "confidence": round(max_conf, 1)
                })
            bounding_boxes.append(boxes_for_slice)
        
        # Base64 encode the flattened 3D volumes
        vol_b64 = base64.b64encode(vol_uint8.tobytes()).decode("ascii")
        prob_b64 = base64.b64encode(prob_uint8.tobytes()).decode("ascii")
        
        return {
            "status": "success",
            "shape": list(vol_zyx.shape), # [96, 96, 96]
            "volume_b64": vol_b64,
            "prob_b64": prob_b64,
            "boundingBoxes": bounding_boxes,
            "fileName": file.filename
        }
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
