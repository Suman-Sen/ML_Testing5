# import re
# from flask import Flask, request, jsonify
# from keras.models import load_model
# from PIL import Image
# import numpy as np
# import io

# app = Flask(__name__)
# model = load_model(r"models/mobilenetv3large_model_e75_regularized_tune.keras")
# classes = ['Aadhaar', 'PAN', 'Passport']

# def preprocess_image(image_bytes):
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
#     arr = np.array(img) / 255.0
#     return np.expand_dims(arr, axis=0)

# def infer_from_filename(filename):
#     name = filename.lower()
#     if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
#         return "Aadhaar"
#     elif "pan" in name:
#         return "PAN"
#     elif "passport" in name:
#         return "Passport"
#     return None



# @app.route('/predict', methods=['POST'])
# def predict():
#     file = request.files.get('image')
#     if not file:
#         return jsonify({'error': 'No image provided'}), 400

#     filename_based = infer_from_filename(file.filename)
#     img_array = preprocess_image(file.read())
#     pred = model.predict(img_array)
#     model_based = classes[np.argmax(pred)]

#     final_label = filename_based if filename_based else model_based

#     return jsonify({
#         'filename_based': filename_based,
#         'model_based': model_based,
#         'label': final_label,
#         # "metadata":{
#         #     created,etc
#         # }
#     })


# @app.route('/metadata', methods=['POST'])
# def metadata():
#     file = request.files.get('image')
#     if not file:
#         return jsonify({'error': 'No image provided'}), 400

#     filename_based = infer_from_filename(file.filename)
#     return jsonify({
#         'filename': file.filename,
#         'inferred_label': filename_based if filename_based else 'Unknown'
#     })

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=6000)


# import re
# import io
# import numpy as np
# from flask import Flask, request, jsonify
# from keras.models import load_model
# from PIL import Image, ExifTags
# import fitz  # PyMuPDF

# app = Flask(__name__)
# model = load_model(r"models/mobilenetv3large_model_e75_regularized_tune.keras")
# classes = ['Aadhaar', 'PAN', 'Passport']

# def preprocess_image(image_bytes):
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
#     arr = np.array(img) / 255.0
#     return np.expand_dims(arr, axis=0)

# def infer_from_filename(filename):
#     name = filename.lower()
#     if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
#         return "Aadhaar"
#     elif "pan" in name:
#         return "PAN"
#     elif "passport" in name:
#         return "Passport"
#     return None

# def extract_metadata(image: Image.Image):
#     exif_data = {}
#     try:
#         raw_exif = image._getexif()
#         if raw_exif:
#             for tag_id, value in raw_exif.items():
#                 tag = ExifTags.TAGS.get(tag_id, tag_id)
#                 exif_data[tag] = value
#     except Exception:
#         pass

#     return {
#         "width": image.width,
#         "height": image.height,
#         "format": image.format,
#         "exif": exif_data,
#     }

# def pdf_to_image(pdf_bytes):
#     doc = fitz.open("pdf", pdf_bytes)
#     if len(doc) == 0:
#         return None
#     page = doc[0]
#     pix = page.get_pixmap(dpi=200)
#     img_bytes = pix.tobytes("jpeg")
#     return Image.open(io.BytesIO(img_bytes))

# @app.route('/predict', methods=['POST'])
# def predict():
#     file = request.files.get('image')
#     if not file:
#         return jsonify({'error': 'No image provided'}), 400

#     filename = file.filename.lower()
#     raw = file.read()

#     try:
#         image = pdf_to_image(raw) if filename.endswith(".pdf") else Image.open(io.BytesIO(raw)).convert("RGB")
#     except Exception as e:
#         return jsonify({'error': 'Failed to load image', 'details': str(e)}), 500

#     metadata = extract_metadata(image)
#     img_array = preprocess_image(raw if not filename.endswith(".pdf") else image.tobytes())
#     pred = model.predict(img_array)
#     model_based = classes[np.argmax(pred)]
#     file_based = infer_from_filename(filename)

#     return jsonify({
#         'file_based': file_based,
#         'model_based': model_based,
#         'label': model_based,
#         'metadata': metadata
#     })

# @app.route('/metadata', methods=['POST'])
# def file_based_scan():
#     file = request.files.get('image')
#     if not file:
#         return jsonify({'error': 'No image provided'}), 400

#     filename = file.filename.lower()
#     raw = file.read()

#     try:
#         image = pdf_to_image(raw) if filename.endswith(".pdf") else Image.open(io.BytesIO(raw)).convert("RGB")
#     except Exception as e:
#         return jsonify({'error': 'Failed to load image', 'details': str(e)}), 500

#     metadata = extract_metadata(image)
#     file_based = infer_from_filename(filename)

#     return jsonify({
#         'filename': file.filename,
#         'file_based': file_based if file_based else 'Unknown',
#         'metadata': metadata
#     })

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=6000)


import re
import io
import numpy as np
from flask import Flask, request, jsonify
from keras.models import load_model
from PIL import Image, ExifTags
import fitz  # PyMuPDF

app = Flask(__name__)

# Load model
model = load_model("models/mobilenetv3large_model_e75_regularized_tune.keras")
classes = ['Aadhaar', 'PAN', 'Passport']

# --- Utility Functions ---

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    arr = np.array(img) / 255.0
    return np.expand_dims(arr, axis=0)

def infer_from_filename(filename):
    name = filename.lower()
    if any(x in name for x in ["aadhaar", "aadhar", "aadha"]):
        return "Aadhaar"
    elif "pan" in name:
        return "PAN"
    elif "passport" in name:
        return "Passport"
    return None

def extract_image_metadata(image: Image.Image):
    exif_data = {}
    try:
        raw_exif = image._getexif()
        if raw_exif:
            for tag_id, value in raw_exif.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                exif_data[tag] = str(value)
    except Exception:
        pass

    return {
        "width": image.width,
        "height": image.height,
        "format": image.format,
        "exif": exif_data if exif_data else "None found"
    }

def extract_pdf_metadata(pdf_bytes):
    try:
        doc = fitz.open("pdf", pdf_bytes)
        meta = doc.metadata
        return {
            "author": meta.get("author"),
            "creator": meta.get("creator"),
            "producer": meta.get("producer"),
            "title": meta.get("title"),
            "creation_date": meta.get("creationDate"),
            "modification_date": meta.get("modDate"),
            "page_count": doc.page_count
        }
    except Exception as e:
        return {"error": str(e)}

def pdf_to_image(pdf_bytes):
    doc = fitz.open("pdf", pdf_bytes)
    if len(doc) == 0:
        return None
    page = doc[0]
    pix = page.get_pixmap(dpi=200)
    img_bytes = pix.tobytes("jpeg")
    return Image.open(io.BytesIO(img_bytes))

# --- Routes ---

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    filename = file.filename.lower()
    raw = file.read()

    try:
        if filename.endswith(".pdf"):
            image = pdf_to_image(raw)
            if image is None:
                raise Exception("PDF has no pages")
            metadata = extract_pdf_metadata(raw)
            img_array = preprocess_image(image.tobytes())
        else:
            image = Image.open(io.BytesIO(raw)).convert("RGB")
            metadata = extract_image_metadata(image)
            img_array = preprocess_image(raw)
    except Exception as e:
        return jsonify({'error': 'Failed to load image', 'details': str(e)}), 500

    pred = model.predict(img_array)
    model_based = classes[np.argmax(pred)]
    file_based = infer_from_filename(filename)

    return jsonify({
        'file_based': file_based,
        'model_based': model_based,
        'label': model_based,
        'metadata': metadata
    })


@app.route('/metadata', methods=['POST'])
def file_based_scan():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    filename = file.filename.lower()
    raw = file.read()

    try:
        if filename.endswith(".pdf"):
            image = pdf_to_image(raw)
            if image is None:
                raise Exception("PDF has no pages")
            metadata = extract_pdf_metadata(raw)
        else:
            image = Image.open(io.BytesIO(raw)).convert("RGB")
            metadata = extract_image_metadata(image)
    except Exception as e:
        return jsonify({'error': 'Failed to load image', 'details': str(e)}), 500

    file_based = infer_from_filename(filename)

    return jsonify({
        'filename': file.filename,
        'file_based': file_based if file_based else 'Unknown',
        'metadata': metadata
    })


# --- Start the Flask server ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)
