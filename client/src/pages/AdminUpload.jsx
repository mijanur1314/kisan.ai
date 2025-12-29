import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { API_BASE } from "../utils/api";

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const uploadPdf = async () => {
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch(`${API_BASE}/upload/pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus({ type: "success", message: "PDF uploaded successfully" });
      setFile(null);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4 text-green-700">
          <FileText />
          <h2 className="text-lg font-semibold">Admin PDF Upload</h2>
        </div>

        <label className="border-2 border-dashed border-green-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50">
          <Upload className="text-green-600 mb-2" />
          <span className="text-sm text-gray-600">
            {file ? file.name : "Click to select a PDF"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <button
          onClick={uploadPdf}
          disabled={!file || loading}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" /> Uploading
            </>
          ) : (
            "Upload PDF"
          )}
        </button>

        {status && (
          <div
            className={`mt-4 flex items-center gap-2 text-sm ${
              status.type === "success" ? "text-green-700" : "text-red-600"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
