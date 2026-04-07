import os
import dicom2nifti
import nibabel as nib

# --- CONFIGURATION ---
dicom_directory = "01-01-2000-NA-NA-30178" # Your exact folder
output_folder = "dataset_3d"
output_filename = "patient_0001_scan.nii.gz"

os.makedirs(output_folder, exist_ok=True)

print(f"🧱 Reading all 2D slices from {dicom_directory}...")
print("⚙️ Compiling into a solid 3D NIfTI volume... (this takes a moment)")

try:
    # UPDATED FUNCTION NAME HERE:
    dicom2nifti.dicom_series_to_nifti(dicom_directory, os.path.join(output_folder, output_filename))
    
    # Let's verify it worked by checking the 3D dimensions
    nifti_img = nib.load(os.path.join(output_folder, output_filename))
    dimensions = nifti_img.shape
    
    print("✅ SUCCESS!")
    print(f"📦 3D Volume created successfully at: {output_folder}/{output_filename}")
    print(f"📏 Dimensions of your 3D Lung: {dimensions} (X, Y, Z slices)")
    
except Exception as e:
    print(f"❌ Error during 3D conversion: {e}")