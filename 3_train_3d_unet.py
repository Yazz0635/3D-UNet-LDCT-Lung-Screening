import os
import torch
from monai.networks.nets import UNet
from monai.losses import DiceCELoss
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd, 
    Resized, ScaleIntensityd, ToTensord
)
from monai.data import Dataset, DataLoader

print("🧠 Initializing 3D Medical AI Pipeline...")

# --- 1. CONFIGURATION ---
data_dir = "dataset_3d"
scan_path = os.path.join(data_dir, "patient_0001_scan.nii.gz")
mask_path = os.path.join(data_dir, "patient_0001_mask.nii.gz")

# We format our data as a dictionary so MONAI knows which mask belongs to which scan
data_dicts = [{"image": scan_path, "label": mask_path}]

# --- 2. THE TRANSFORM PIPELINE ---
# This pre-processes the heavy 3D data so your computer doesn't explode
transforms = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]), # Required for PyTorch (Channels, X, Y, Z)
    ScaleIntensityd(keys=["image"]),              # Normalizes the X-ray brightness between 0 and 1
    Resized(keys=["image", "label"], spatial_size=(96, 96, 96), mode=("trilinear", "nearest")), # Shrinks the 3D block to save RAM
    ToTensord(keys=["image", "label"])            # Converts to PyTorch format
])

# --- 3. DATA LOADING ---
print("📦 Loading and transforming 3D volumes... (this might take a few seconds)")
dataset = Dataset(data=data_dicts, transform=transforms)
# We use batch_size=1 because 3D data is huge
dataloader = DataLoader(dataset, batch_size=1, shuffle=True) 

# --- 4. BUILD THE 3D U-NET ---
# Determine if you have an Nvidia GPU (CUDA), otherwise use CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"⚙️ Hardware Selected: {device.type.upper()}")

model = UNet(
    spatial_dims=3,
    in_channels=1,
    out_channels=1,
    channels=(16, 32, 64, 128),
    strides=(2, 2, 2)
).to(device)

# --- 5. THE LOSS FUNCTION & OPTIMIZER ---
# DiceLoss is the global standard for medical segmentation. It measures overlap!
loss_function = DiceCELoss(sigmoid=True)
optimizer = torch.optim.Adam(model.parameters(), 1e-3)

# --- 6. THE TRAINING LOOP ---
print("🚀 Starting 3D Training! (Proof of Concept - 10 Epochs)")
max_epochs = 10

for epoch in range(max_epochs):
    print(f"\n--- Epoch {epoch + 1}/{max_epochs} ---")
    model.train()
    epoch_loss = 0
    step = 0
    
    for batch_data in dataloader:
        step += 1
        inputs, labels = batch_data["image"].to(device), batch_data["label"].to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = loss_function(outputs, labels)
        loss.backward()
        optimizer.step()
        
        epoch_loss += loss.item()
        print(f"   Step {step} - Dice Loss: {loss.item():.4f} (Lower is better!)")
        
print("✅ Proof of Concept Training Complete!")
# Save the model's brain
torch.save(model.state_dict(), "best_3d_unet.pth")
print("💾 3D Model saved as 'best_3d_unet.pth'")