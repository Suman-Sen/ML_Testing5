from flask import Flask, request, jsonify
from keras.models import load_model
from PIL import Image
import numpy as np
import io

app = Flask(__name__)
model = load_model("models/mobilenetv3large_model_e75_regularized_tune.keras")
classes = ['Aadhaar', 'PAN', 'Passport']

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    arr = np.array(img) / 255.0
    return np.expand_dims(arr, axis=0)

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    img_array = preprocess_image(file.read())
    pred = model.predict(img_array)
    label = classes[np.argmax(pred)]
    return jsonify({'label': label})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)
