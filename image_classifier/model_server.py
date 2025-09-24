import re
import io
import numpy as np
import exifread
from flask import Flask, request, jsonify
from keras.models import load_model
from keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
from PIL import Image
import fitz  # PyMuPDF

# import pillow_avif_plugin

app = Flask(__name__)

# Load model and class labels
try:
    model = load_model("models/id_document_classifier_dataset.keras")
    classes = ["Pan card", "aadhar", "passport"]
except Exception as e:
    raise RuntimeError(f"Failed to load ML model: {e}")

# Utility Functions


def preprocess_image(pil_img):
    try:
        img = pil_img.convert("RGB").resize((224, 224))
        img_array = image.img_to_array(img)
        img_array = preprocess_input(img_array)
        return np.expand_dims(img_array, axis=0)
    except Exception as e:
        raise RuntimeError(f"Image preprocessing failed: {e}")


def infer_from_filename(filename):
    name = filename.lower()
    if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
        return "Aadhaar"
    elif "pan" in name:
        return "PAN"
    elif "passport" in name:
        return "Passport"
    return None


def extract_image_metadata(image_bytes):
    metadata = {
        "width": None,
        "height": None,
        "format": None,
        "exif": {},
    }

    try:
        img = Image.open(io.BytesIO(image_bytes))
        metadata["width"] = img.width
        metadata["height"] = img.height
        metadata["format"] = img.format
    except Exception as e:
        metadata["error"] = f"Image open failed: {e}"
        return metadata

    try:
        tags = exifread.process_file(io.BytesIO(image_bytes), details=False)
        metadata["exif"] = {
            tag: str(tags[tag])
            for tag in tags
            if tag not in ("JPEGThumbnail", "TIFFThumbnail")
        }
    except Exception as e:
        metadata["exif_error"] = f"EXIF extraction failed: {e}"

    return metadata


def extract_pdf_metadata(pdf_bytes):
    try:
        doc = fitz.open("pdf", pdf_bytes)
        meta = doc.metadata or {}
        return {
            "author": meta.get("author"),
            "creator": meta.get("creator"),
            "producer": meta.get("producer"),
            "title": meta.get("title"),
            "creation_date": meta.get("creationDate"),
            "modification_date": meta.get("modDate"),
            "page_count": doc.page_count,
        }
    except Exception as e:
        return {"error": f"PDF metadata extraction failed: {e}"}


def pdf_to_image(pdf_bytes):
    try:
        doc = fitz.open("pdf", pdf_bytes)
        if len(doc) == 0:
            raise ValueError("PDF has no pages")
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("jpeg")
        return Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        raise RuntimeError(f"PDF to image conversion failed: {e}")


# API Route
@app.route("/predict", methods=["POST"])
def predict():
    file = request.files.get("image")
    if not file:
        print("No image provided")
        return jsonify({"error": "No image provided"}), 400

    filename = file.filename.lower()
    print(f"Received file: {filename}")

    try:
        raw = file.read()
        print("File read successfully")

        if filename.endswith(".pdf"):
            print("Processing PDF")
            image_obj = pdf_to_image(raw)
            metadata = extract_pdf_metadata(raw)
        else:
            print("Processing image")
            image_obj = Image.open(io.BytesIO(raw))
            metadata = extract_image_metadata(raw)

        img_array = preprocess_image(image_obj)
        print("Preprocessing complete")
    except Exception as e:
        print("Error during file processing:", str(e))
        return jsonify({"error": "Failed to process file", "details": str(e)}), 500

    try:
        print("Running model prediction")

        # pred = model.predict(img_array)
        # model_based = classes[np.argmax(pred)]

        pred = model.predict(img_array)[0]  # Get the first prediction vector
        predicted_index = np.argmax(pred)
        model_based = classes[predicted_index]
        confidence = float(pred[predicted_index]) * 100  # Convert to percentage

        print("Prediction complete")
    except Exception as e:
        print("Error during model prediction:", str(e))
        return jsonify({"error": "Model prediction failed", "details": str(e)}), 500

    file_based = infer_from_filename(filename)

    # return jsonify({
    #     'file_based': file_based,
    #     'model_based': model_based,
    #     'label': model_based,
    #     'metadata': metadata
    # })
    return jsonify(
        {
            "file_based": file_based,
            "model_based": model_based,
            "label": model_based,
            "confidence": f"{confidence:.2f}%",
            "metadata": metadata,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000, debug=True)
