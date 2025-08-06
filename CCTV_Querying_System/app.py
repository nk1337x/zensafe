import os
import shutil
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from werkzeug.utils import secure_filename
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from mistralai import Mistral

# from florenceCaptioning import generateVideoCaptionCorpus

app = Flask(__name__)
CORS(app)

DATA_DIR = "data/documents"
FOOTAGE_DIR = "data/footages"
CHROMA_DB_DIR = "./chroma_db"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(FOOTAGE_DIR, exist_ok=True)

# mistral_client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))
mistral_client = Mistral(api_key="uIsijMojit5bcCYUYKN7TZJMFDXEDJtk")  # Replace with your actual API key
MODEL_NAME = "mistral-large-latest"


def update_vector_store(place):
    file_path = os.path.join(DATA_DIR, f"{place}.txt")
    if not os.path.exists(file_path):
        return {"error": "File not found"}, 400

    try:
        embeddings = OllamaEmbeddings(model="nomic-embed-text")
        vector_store = Chroma(
            embedding_function=embeddings, persist_directory=CHROMA_DB_DIR
        )
        vector_store.delete_collection()
        del vector_store
    except Exception as e:
        print(f"Warning: Could not release ChromaDB before deletion: {str(e)}")

    import time

    time.sleep(2)

    if os.path.exists(CHROMA_DB_DIR):
        shutil.rmtree(CHROMA_DB_DIR, ignore_errors=True)
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    loader = TextLoader(file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=150)
    splits = text_splitter.split_documents(documents)

    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    Chroma.from_documents(
        documents=splits, embedding=embeddings, persist_directory=CHROMA_DB_DIR
    )

    return {"message": "Vector store updated successfully"}, 200


def get_response_from_mistral(query):
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    try:
        vector_store = Chroma(
            embedding_function=embeddings, persist_directory=CHROMA_DB_DIR
        )
        retriever = vector_store.as_retriever(
            search_type="similarity", search_kwargs={"k": 15}
        )

        relevant_docs = retriever.invoke(query)
        context = "\n".join([doc.page_content for doc in relevant_docs])

        system_prompt = """
        You are a bot, an AI assistant designed to aid law enforcement in evidence retrieval from CCTV footage 100 times faster.
        You are provided with textual descriptions of CCTV footage, captured at one-second intervals.
        Each description includes a timestamp (format [H:M:S]), location, and a detailed caption of the scene.
        
        When answering queries:
        1. If the query mentions a specific time or time range, focus on events that occurred within that timeframe
        2. Be precise about timestamps in your response
        3. If multiple relevant incidents are found, organize them chronologically
        4. If no information is available for the specified time or criteria, clearly state this
        5. Never invent or assume details not present in the footage descriptions
        6. Be concise but thorough in your reporting
        7. Ensure if timestamps are there provide them in chronological order."
        8. If the user asks about you give them a brief self intro"
        9. Make sure to comibine closer timestamps intelligently into one single timestamp as they specify the same object at consecutive time intervals
        
        Remember that your responses will be used for law enforcement purposes, so accuracy is critical.
        """

        human_prompt = f"""
        Context:
        {context}
        
        Question: {query}
        
        Provide a precise and detailed response based on the context above.
        """

        chat_response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": human_prompt},
            ],
        )
        print(chat_response.choices[0].message.content)

        return {
            "response": chat_response.choices[0].message.content,
            "retrieved_documents": context,
        }, 200

    except Exception as e:
        return {"error": str(e)}, 500


@app.route("/updateVectorStore", methods=["POST"])
def update_vector_store_api():
    data = request.json
    place = data.get("place")
    if not place:
        return {"error": "Missing 'place' parameter"}, 400
    return update_vector_store(place)


@app.route("/getResponse", methods=["POST"])
def get_response_api():
    data = request.json
    query = data.get("query")
    if not query:
        return {"error": "Missing 'query' parameter"}, 400

    return get_response_from_mistral(query)


# @app.route("/createFlorenceDocument", methods=["POST"])
# def create_florence_document():
#     if "video" not in request.files or "place" not in request.form:
#         return {"error": "Missing video file or 'place' attribute"}, 400

#     video = request.files["video"]
#     place = request.form["place"].strip()

#     if video.filename == "":
#         return {"error": "No selected file"}, 400

#     filename = secure_filename(f"{place}.mp4")
#     save_path = os.path.join(FOOTAGE_DIR, filename)

#     video.save(save_path)

#     generateVideoCaptionCorpus(video_path=save_path,
#         place=place)

#     return {"message": "Video uploaded successfully", "file_path": save_path}, 200


@app.route("/getCameras", methods=["GET"])
def get_cameras():
    files = [f for f in os.listdir(DATA_DIR) if f.endswith(".txt")]
    files = [file.split(".")[0] for file in files]
    return jsonify({"cameras": files})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
