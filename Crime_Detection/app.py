from flask import Flask, request, jsonify, send_from_directory
import os
import pickle
from werkzeug.utils import secure_filename
from pymongo import MongoClient
import requests
import socket
from makepred import main

PINATA_API_KEY = '9295ed624ad0803afc3d'
PINATA_SECRET_API_KEY = '0cf8b2ac3e476724967ef5fe17d66deb7a4d1630156d0545c2296f426f2dc795'

def upload_to_pinata(video_path):
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }

    with open(video_path, 'rb') as file:
        filename = os.path.basename(video_path)  
        files = {
            'file': (filename, file)  
        }
        response = requests.post(url, files=files, headers=headers)

    if response.status_code == 200:
        ipfs_hash = response.json()["IpfsHash"]
        print(f"--> Successfully uploaded. IPFS CID: {ipfs_hash}")
        return ipfs_hash
    else:
        print(f"--> Failed to upload. Status code: {response.status_code}")
        print(response.text)
        return None


app = Flask(__name__)


def get_local_ip():
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


flask_url = f"http://{get_local_ip()}:5005"
# flask_url = "http://192.168.60.53:5005"

mongoDbCollection = "UrbanGuard"

print(f"--> Flask URL: {flask_url}")

mongo_uri = (
    f"mongodb+srv://nidhins1807:testking54321@zensafe.rewx0ps.mongodb.net/{mongoDbCollection}"
    
)

print("--> Connecting to MongoDB")

client = MongoClient(mongo_uri)

db = client[mongoDbCollection]

alerts_collection = db["alerts"]

print("--> Connected to MongoDB")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def detect_anomaly(video_path, oversampledCrop):

    input_video_path = video_path

    pred = main(
        video_path=input_video_path, oversampledCrop=oversampledCrop, show_plot=True
    )
    if pred:
        upload_to_pinata(input_video_path)
        return True
    return False


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected for uploading"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    url = f"{flask_url}/uploads/{filename}"
    return jsonify({"message": "File uploaded successfully", "url": url}), 200


@app.route("/uploads/<filename>", methods=["GET"])
def get_file(filename):
    print(f"Request to fetch file: {filename}")
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/analyze", methods=["POST"])
def analyze_video():
    print("--> Received a request")

    if "video" not in request.files:
        print("No video file provided in the request.")
        return jsonify({"error": "No video file provided"}), 400

    video = request.files["video"]
    oversampledCrop = request.form["oversampledCrop"]
    video_path = os.path.join("./uploaded_videos", video.filename)
    os.makedirs("./uploaded_videos", exist_ok=True)
    video.save(video_path)

    print(">>> Performing crime detection")
    anomaly_detected = detect_anomaly(video_path, oversampledCrop)
    print(">>> Crime detected: ", anomaly_detected)

    if anomaly_detected:

        video_url = upload_video_to_localhost(video_path)
        if video_url:
            alert_data = {
                "alert": True,
                "footageUrl": video_url,
                "location": request.form["location"],
                "anomalyDate": request.form["anomalyDate"],
                "anomalyTime": request.form["anomalyTime"],
                "coordinates": request.form["coordinates"],
                "createdContract": "false",
            }
            print(f"--> Inserting alert data into MongoDB: {alert_data}")
            alerts_collection.insert_one(alert_data)
            print("--> Alert data inserted into MongoDB")
        else:
            print("Failed to upload video for shareable URL.")

    print(f"--> Returning response: {{'anomaly': {anomaly_detected}}}")
    print(
        "-------------------------------------------------------------------------------------------------------------------------------------------------------------"
    )
    os.remove(video_path)
    return jsonify({"anomaly": anomaly_detected})


def upload_video_to_localhost(file_path):
    url = f"{flask_url}/upload"
    try:
        with open(file_path, "rb") as file:
            files = {"file": file}
            response = requests.post(url, files=files)
            if response.status_code == 200:
                return response.json().get("url")
            else:
                print("Failed to upload. Server response:", response.json())
    except Exception as e:
        print("Error:", e)
    return None


if __name__ == "__main__":
    print("--> Starting Flask server")
    app.run(host="0.0.0.0", port=5005, debug=False)
