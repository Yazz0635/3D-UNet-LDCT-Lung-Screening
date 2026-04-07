import torch
from monai.networks.nets import UNet

def predict_tumor(scan_tensor, model_path="production_best_3d_unet.pth"):
    """
    The Bridge: Takes a 3D scan, loads the trained AI, and returns the tumor mask.
    """
    # 1. Load the exact same architecture we trained
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = UNet(
        spatial_dims=3, in_channels=1, out_channels=1,
        channels=(16, 32, 64, 128), strides=(2, 2, 2)
    ).to(device)
    
    # 2. Load the brain we just trained on Kaggle
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval() # Set to "Test Mode"
    
    # 3. Predict!
    with torch.no_grad():
        output = model(scan_tensor.to(device))
        # Convert raw math into a solid 0 (healthy) or 1 (tumor) mask
        final_mask = (torch.sigmoid(output) > 0.5).int()
        
    return final_mask.cpu().numpy()