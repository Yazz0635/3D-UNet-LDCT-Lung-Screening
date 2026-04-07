# 🩻 3D Volumetric Segmentation of Low-Dose CT Scans

**Project By:** Aditya Roy (23MIC0089)
**Domain:** Soft Computing & Medical AI

## 📌 The Problem
Low-Dose CT (LDCT) scans reduce radiation exposure by up to 90%, making them the global standard for annual lung cancer screening. However, the inherent trade-off is that LDCT images are significantly noisier and grainier than standard CTs. This makes it incredibly difficult to confidently spot early-stage, millimeter-sized micro-nodules using standard 2D slice-by-slice analysis.

## 💡 The Solution
This project introduces a **3D Volumetric AI Pipeline**. Instead of analyzing flat 2D images, our architecture compiles raw DICOM slices into solid 3D NIfTI volumes. We utilize a **3D U-Net Neural Network** to analyze the entire spatial depth of the lung cavity simultaneously, cutting through LDCT noise to accurately segment and highlight the exact 3D boundaries of potential tumors.

## ⚙️ Technical Architecture
* **Data Engineering:** Custom Python scripts utilizing `pydicom` and `nibabel` to translate raw hospital DICOMs and doctor XML annotations into perfectly aligned 3D `.nii.gz` volumes and binary masks.
* **Model:** 3D U-Net (PyTorch/MONAI) 
* **Loss Function:** Dice Cross-Entropy (DiceCELoss) to combat the extreme class imbalance of micro-nodules vs. healthy lung tissue.
* **Front-End:** Streamlit dashboard for real-time 3D axial slicing and AI overlay visualization.

## 🚀 Repository Structure
* `1_build_3D_volume.py`: Compiles raw 2D DICOM slices into a 3D NIfTI block.
* `2_build_3D_mask.py`: Translates physician XML polygon coordinates into a 3D volumetric answer key.
* `3_train_3d_unet.py`: Local PyTorch training pipeline (Proof of Concept).
* *Note: Production training runs via Kaggle Cloud GPUs using the Medical Segmentation Decathlon (Task06_Lung) benchmark dataset.*