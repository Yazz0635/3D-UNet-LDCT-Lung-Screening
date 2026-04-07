import os
import glob
import pydicom
import numpy as np
import cv2
import nibabel as nib
import xml.etree.ElementTree as ET

# --- CONFIGURATION ---
dicom_directory = "01-01-2000-NA-NA-30178" # Make sure this matches!
xml_files = glob.glob("*.xml")
nifti_image_path = "dataset_3d/patient_0001_scan.nii.gz"
output_mask_path = "dataset_3d/patient_0001_mask.nii.gz"

if not xml_files:
    print("❌ Could not find the XML file!")
    exit()
xml_file = xml_files[0]

print("🧠 Translating Doctor's XML notes into a 3D Volumetric Mask...")

# 1. Figure out the physical Z-order of the slices
dicom_files = glob.glob(f"{dicom_directory}/**/*.dcm", recursive=True)
z_coords = []
for f in dicom_files:
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True)
        z_coords.append(round(float(ds.ImagePositionPatient[2]), 2))
    except:
        pass

# Sort them to match how the 3D block is stacked
z_coords = sorted(list(set(z_coords)))

# 2. Create an empty 3D block (512, 512, 133) filled with 0s (healthy tissue)
mask_3d = np.zeros((512, 512, len(z_coords)), dtype=np.uint8)

# 3. Parse XML and draw the tumors (1s) into the 3D block
tree = ET.parse(xml_file)
root = tree.getroot()
for elem in root.iter():
    if '}' in elem.tag:
        elem.tag = elem.tag.split('}', 1)[1]

tumor_count = 0
for roi in root.findall('.//roi'):
    z_pos_elem = roi.find('imageZposition')
    x_coords = [float(x.text) for x in roi.findall('.//edgeMap/xCoord')]
    y_coords = [float(y.text) for y in roi.findall('.//edgeMap/yCoord')]

    if not x_coords or z_pos_elem is None:
        continue

    xml_z = round(float(z_pos_elem.text), 2)

    # Find the matching slice depth index (Z-axis)
    slice_idx = None
    for i, z in enumerate(z_coords):
        if abs(z - xml_z) <= 2.0:
            slice_idx = i
            break

    if slice_idx is not None:
        pts = np.array(list(zip(x_coords, y_coords)), np.int32).reshape((-1, 1, 2))

        # Create a blank 2D canvas for OpenCV to safely draw on
        slice_mask = np.zeros((512, 512), dtype=np.uint8)

        # Fix micro-nodules (the 0-pixel bug)
        if len(pts) <= 2:
            x, y = int(x_coords[0]), int(y_coords[0])
            cv2.circle(slice_mask, (x, y), 5, 1, -1)
        else:
            # Draw the 2D tumor shape
            cv2.fillPoly(slice_mask, [pts], 1)
            
        # Stamp the canvas back into the main 3D block
        mask_3d[:, :, slice_idx] = np.bitwise_or(mask_3d[:, :, slice_idx], slice_mask)
            
        tumor_count += 1

print(f"✅ Injected {tumor_count} tumor cross-sections into the 3D space!")

# 4. Save the new 3D Mask
try:
    # We load the patient scan to "steal" its spatial grid data (the affine matrix)
    # This ensures the mask perfectly aligns with the patient's body
    img_nifti = nib.load(nifti_image_path)
    
    # Safety alignment check
    if img_nifti.shape != mask_3d.shape:
        mask_3d = np.transpose(mask_3d, (1, 0, 2))
        
    mask_nifti = nib.Nifti1Image(mask_3d, img_nifti.affine, img_nifti.header)
    nib.save(mask_nifti, output_mask_path)
    print(f"📦 3D Mask saved successfully at: {output_mask_path}")
except Exception as e:
    print(f"❌ Failed to save 3D Mask: {e}")