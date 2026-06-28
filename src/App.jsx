import { useState, useRef, useCallback } from "react";
import "./App.css";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadIcon() {
  return (
    <svg
      className="upload-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="file-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="sparkle-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" />
    </svg>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((selected) => {
    setError("");
    if (selected && selected.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      setFile(null);
      return;
    }
    if (selected) {
      setFile(selected);
      setResults(null);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onSelectClick = () => inputRef.current?.click();

  const onInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const onAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(
  "http://localhost:3001/analyze",
  {
    method: "POST",
    body: formData,
  }
);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      console.log("Backend Response:", data);

      if (!data.success) {
        throw new Error(data.error || "Analysis failed.");
      }

      if (!data.result) {
        throw new Error("No analysis result returned.");
      }

      setResults(data.result);
    } catch (err) {
      console.error(err);
      setResults(null);
      setError(err.message || "Unable to analyze the resume.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRemoveFile = () => {
    setFile(null);
    setResults(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="app">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <main className="container">
        <header className="hero">
          <div className="badge">
            <SparkleIcon />
            <span>Powered by AI</span>
          </div>
          <h1 className="title">AI Resume Analyzer</h1>
          <p className="subtitle">
            Upload your resume and get instant AI feedback
          </p>
        </header>

        <section
          className={`dropzone ${isDragging ? "dragging" : ""} ${error ? "error" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={onSelectClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && onSelectClick()
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onInputChange}
            hidden
          />
          <UploadIcon />
          <p className="dropzone-text">
            Drag &amp; Drop your resume here or click to browse
          </p>
          <p className="dropzone-hint">PDF files only · Max 10MB</p>
        </section>

        {error && <p className="error-text">{error}</p>}

        {file && (
          <div className="file-info">
            <div className="file-info-left">
              <FileIcon />
              <div className="file-meta">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatBytes(file.size)}</span>
              </div>
            </div>
            <button
              className="remove-btn"
              onClick={onRemoveFile}
              aria-label="Remove file"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <button
          className={`analyze-btn ${file && !isLoading ? "active" : "disabled"}`}
          onClick={onAnalyze}
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <span className="loading-content">
              <span className="spinner" />
              Analyzing...
            </span>
          ) : (
            "Analyze My Resume"
          )}
        </button>

        <section className={`results ${results ? "visible" : "placeholder"}`}>
          <h2 className="results-heading">
            {results ? "Your Analysis Results" : "Results will appear here"}
          </h2>

          <div className="cards-grid">
            <div className="card skills-found">
              <div className="card-header">
                <span className="card-icon dot-green" />
                <h3>Skills Found</h3>
              </div>
              <div className="tag-list">
                {results?.skills_found?.length > 0 ? (
                  results.skills_found.map((s) => (
                    <span key={s} className="tag tag-green">
                      {s}
                    </span>
                  ))
                ) : results ? (
                  <span className="empty-text">No skills found</span>
                ) : (
                  <span className="placeholder-text">
                    Upload a resume to see skills
                  </span>
                )}
              </div>
            </div>

            <div className="card missing-skills">
              <div className="card-header">
                <span className="card-icon dot-amber" />
                <h3>Missing Skills</h3>
              </div>
              <div className="tag-list">
                {results?.missing_skills?.length > 0 ? (
                  results.missing_skills.map((s) => (
                    <span key={s} className="tag tag-amber">
                      {s}
                    </span>
                  ))
                ) : results ? (
                  <span className="empty-text">
                    No missing skills identified
                  </span>
                ) : (
                  <span className="placeholder-text">
                    Upload a resume to see gaps
                  </span>
                )}
              </div>
            </div>

            <div className="card ats-score">
              <div className="card-header">
                <span className="card-icon dot-blue" />
                <h3>ATS Score</h3>
              </div>
              {results ? (
                <>
                  <div className="score-display">
                    <span className="score-number">
                      {results.ats_score ?? 0}
                    </span>
                    <span className="score-total">/100</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${results.ats_score ?? 0}%` }}
                    />
                  </div>
                  <p className="score-label">
                    {results.ats_score >= 80
                      ? "Excellent — highly optimized"
                      : results.ats_score >= 60
                        ? "Good — a few improvements needed"
                        : results.ats_score >= 40
                          ? "Fair — several improvements recommended"
                          : "Needs work — significant improvements recommended"}
                  </p>
                </>
              ) : (
                <div className="score-placeholder">
                  <span className="placeholder-number">--</span>
                  <span className="placeholder-text">Upload to see score</span>
                </div>
              )}
            </div>

            <div className="card job-roles">
              <div className="card-header">
                <span className="card-icon dot-violet" />
                <h3>Recommended Job Roles</h3>
              </div>
              <ul className="role-list">
                {results?.job_roles?.length > 0 ? (
                  results.job_roles.map((r) => (
                    <li key={r} className="role-item">
                      <span className="role-bullet" />
                      {r}
                    </li>
                  ))
                ) : results ? (
                  <li className="empty-text">No roles identified</li>
                ) : (
                  <li className="placeholder-text">
                    Upload to see recommendations
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
