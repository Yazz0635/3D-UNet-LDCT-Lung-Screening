import streamlit as st
import torch
import numpy as np
import matplotlib.pyplot as plt
import os
import matplotlib.patches as patches
from monai.networks.nets import UNet
from monai.transforms import Compose, LoadImaged, EnsureChannelFirstd, Resized, ScaleIntensityd, ToTensord

# --- 1. PAGE SETUP ---
st.set_page_config(layout="wide", page_title="AI Pulmonologist")
st.title("🩻 3D AI Lung Tumor Segmentation")
st.markdown("**Project By:** Aditya Roy (23MIC0089) | **Domain:** Soft Computing & Medical AI")
st.write("This dashboard loads a solid 3D NIfTI block of a Low-Dose CT scan, passes it through our custom 3D U-Net PyTorch model, and highlights suspected tumors in real-time.")

# --- 2. SAFETY CHECKS (Prevents Blank Screens) ---
MODEL_PATH = "production_best_3d_unet.pth"
SCAN_PATH = "dataset_3d/patient_0001_scan.nii.gz"

if not os.path.exists(MODEL_PATH):
    st.error(f"❌ CRITICAL ERROR: Could not find the AI Model '{MODEL_PATH}'. Did you download it from Kaggle and put it in this folder?")
    st.stop() # Stops the app from crashing into a blank screen

if not os.path.exists(SCAN_PATH):
    st.error(f"❌ CRITICAL ERROR: Could not find the 3D Scan '{SCAN_PATH}'. Check your dataset_3d folder!")
    st.stop()

# --- 3. CACHING THE HEAVY AI MODEL ---
@st.cache_resource
def load_model():
    device = torch.device("cpu") # Safe fallback for web dashboards
    model = UNet(
        spatial_dims=3, in_channels=1, out_channels=1,
        channels=(16, 32, 64, 128), strides=(2, 2, 2)
    ).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval() 
    return model, device

# --- 4. CACHING THE 3D DATA ---
@st.cache_resource
def load_and_process_scan():
    transforms = Compose([
        LoadImaged(keys=["image"]),
        EnsureChannelFirstd(keys=["image"]),
        ScaleIntensityd(keys=["image"]),
        Resized(keys=["image"], spatial_size=(96, 96, 96), mode="trilinear"), 
        ToTensord(keys=["image"])
    ])
    data = transforms({"image": SCAN_PATH})
    input_tensor = data["image"].unsqueeze(0) 
    original_volume = data["image"][0].numpy() 
    return input_tensor, original_volume

# --- 5. EXECUTE THE AI ---
# --- 5. EXECUTE THE AI ---
with st.spinner("Loading PyTorch Model & 3D CT Volume..."):
    model, device = load_model()
    input_tensor, original_volume = load_and_process_scan()

    with torch.no_grad():
        output = model(input_tensor.to(device))
        
        # We save TWO versions of the AI's thoughts now:
        # 1. The raw probabilities (0.0 to 1.0) to calculate Confidence
        raw_prob_mask = torch.sigmoid(output).squeeze().cpu().numpy()
        
        # 2. The hard mask (0 or 1) for drawing
        pred_mask = (raw_prob_mask > 0.05).astype(np.uint8) 

# --- 6. THE USER INTERFACE ---
st.markdown("---")
st.markdown("### 🎛️ Navigate 3D Lung Volume")

slice_idx = st.slider("Select Axial Slice (Z-Axis Depth)", min_value=0, max_value=95, value=48)

# --- NEW: CALCULATE CONFIDENCE & DIAGNOSTICS FOR THIS SLICE ---
slice_binary = pred_mask[:, :, slice_idx]
slice_probs = raw_prob_mask[:, :, slice_idx]

pixel_count = np.sum(slice_binary)

# If it found a tumor on this slice, find its highest confidence percentage
if pixel_count > 0:
    max_confidence = np.max(slice_probs[slice_binary > 0]) * 100
    st.success(f"🚨 **Tumor Detected on Slice {slice_idx}!** | Size: {pixel_count} pixels | AI Confidence: **{max_confidence:.1f}%**")
else:
    st.info(f"✅ No tumors detected on Slice {slice_idx}. (Healthy Tissue)")

# --- DRAWING THE IMAGES ---
col1, col2 = st.columns(2)

with col1:
    st.subheader("Raw Low-Dose CT")
    fig1, ax1 = plt.subplots(facecolor='black')
    ax1.imshow(original_volume[:, :, slice_idx].T, cmap="gray", origin="lower")
    ax1.axis("off")
    st.pyplot(fig1)

with col2:
    st.subheader("AI Segmentation & Bounding Box")
    fig2, ax2 = plt.subplots(facecolor='black')
    
    # 1. Draw base X-ray
    ax2.imshow(original_volume[:, :, slice_idx].T, cmap="gray", origin="lower")
    
    # 2. Prepare and draw the red mask
    mask_slice_T = slice_binary.T
    mask_rgba = np.zeros(mask_slice_T.shape + (4,)) 
    mask_rgba[..., 0] = 1.0 # Pure Red
    mask_rgba[..., 3] = np.where(mask_slice_T > 0, 0.6, 0) # 60% opacity
    ax2.imshow(mask_rgba, origin="lower")
    
    # 3. --- NEW: DYNAMIC BOUNDING BOX ---
    if pixel_count > 0:
        # Find all the X and Y coordinates where the tumor exists
        y_indices, x_indices = np.where(mask_slice_T > 0)
        
        # Find the absolute edges of the tumor
        x_min, x_max = x_indices.min(), x_indices.max()
        y_min, y_max = y_indices.min(), y_indices.max()
        
        # Add a little "padding" so the box isn't touching the tumor exactly
        padding = 3
        width = (x_max - x_min) + (padding * 2)
        height = (y_max - y_min) + (padding * 2)
        
        # Draw a bright yellow bounding box around the red mask
        rect = patches.Rectangle(
            (x_min - padding, y_min - padding), 
            width, height, 
            linewidth=2, edgecolor='yellow', facecolor='none'
        )
        ax2.add_patch(rect)
        
    ax2.axis("off")
    st.pyplot(fig2)