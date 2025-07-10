# # from flask import Flask, request, jsonify
# # from keras.models import load_model
# # from PIL import Image
# # import numpy as np
# # import io

# # app = Flask(__name__)
# # model = load_model(r"models/mobilenetv3large_model_e75_regularized_tune.keras")
# # classes = ['Aadhaar', 'PAN', 'Passport']

# # def preprocess_image(image_bytes):
# #     img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
# #     arr = np.array(img) / 255.0
# #     return np.expand_dims(arr, axis=0)

# # @app.route('/predict', methods=['POST'])
# # def predict():
# #     file = request.files.get('image')
# #     if not file:
# #         return jsonify({'error': 'No image provided'}), 400

# #     img_array = preprocess_image(file.read())
# #     pred = model.predict(img_array)
# #     label = classes[np.argmax(pred)]
# #     return jsonify({'label': label})


# # # @app.route('/metadata', methods=['POST'])


# # # @app.route('/rgex',method=['POST'])
    
    
# # if __name__ == '__main__':
# #     app.run(host='0.0.0.0', port=6000)



# from flask import Flask, request, jsonify
# from keras.models import load_model
# from PIL import Image
# import numpy as np
# import io
# import re

# app = Flask(__name__)
# model = load_model(r"models/mobilenetv3large_model_e75_regularized_tune.keras")
# classes = ['Aadhaar', 'PAN', 'Passport']

# def preprocess_image(image_bytes):
#     img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
#     arr = np.array(img) / 255.0
#     return np.expand_dims(arr, axis=0)
# import re


# def infer_from_filename(filename):
#     name = filename.lower()

#     patterns = {
#         'Aadhaar': r'(aad+ha*r*|aad+ha*r*[_\- ]?card|aadh+ar+|aadh+ar+card|aadhar|aadha)',
#         'PAN': r'(pan[_\- ]?card|[^a-z]pan[^a-z]|^pan[^a-z]|[^a-z]pan$|pan(?=[A-Z])|pan$)',
#         'Passport': r'(passport[_\- ]?scan|passport)'
#     }

#     for label, pattern in patterns.items():
#         if re.search(pattern, name):
#             return label
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
#         'label': final_label
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

import re
from flask import Flask, request, jsonify
from keras.models import load_model
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
model = load_model(r"models/mobilenetv3large_model_e75_regularized_tune.keras")
classes = ['Aadhaar', 'PAN', 'Passport']

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



@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    filename_based = infer_from_filename(file.filename)
    img_array = preprocess_image(file.read())
    pred = model.predict(img_array)
    model_based = classes[np.argmax(pred)]

    final_label = filename_based if filename_based else model_based

    return jsonify({
        'filename_based': filename_based,
        'model_based': model_based,
        'label': final_label,
        # "metadata":{
        #     created,etc
        # }
    })


@app.route('/metadata', methods=['POST'])
def metadata():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    filename_based = infer_from_filename(file.filename)
    return jsonify({
        'filename': file.filename,
        'inferred_label': filename_based if filename_based else 'Unknown'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)