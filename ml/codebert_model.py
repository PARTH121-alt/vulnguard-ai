import os


def get_codebert_embeddings(code_snippets, max_length=512):
    try:
        from transformers import AutoTokenizer, AutoModel
        import torch

        model_name = "microsoft/codebert-base"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name)

        embeddings = []
        for code in code_snippets:
            inputs = tokenizer(code, return_tensors="pt", max_length=max_length,
                             truncation=True, padding="max_length")
            with torch.no_grad():
                outputs = model(**inputs)
            embedding = outputs.last_hidden_state.mean(dim=1).numpy()
            embeddings.append(embedding[0])

        return embeddings
    except ImportError:
        print("transformers package not installed. Install with: pip install transformers torch")
        return None


def predict_with_codebert(code, model_path=None):
    if model_path and os.path.exists(model_path):
        try:
            import joblib
            classifier = joblib.load(model_path)
            embeddings = get_codebert_embeddings([code])
            if embeddings:
                prediction = classifier.predict([embeddings[0]])
                probability = classifier.predict_proba([embeddings[0]])
                return {
                    "vulnerability_detected": bool(prediction[0]),
                    "confidence": float(max(probability[0])),
                    "model_used": "codebert",
                    "is_demo": False,
                }
        except Exception as e:
            print(f"CodeBERT prediction failed: {e}")

    return {
        "vulnerability_detected": None,
        "confidence": None,
        "model_used": "codebert",
        "is_demo": True,
        "note": "CodeBERT requires fine-tuning on vulnerability dataset. Currently showing demo status.",
    }
