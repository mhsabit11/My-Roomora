import React, {useState, useCallback} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES} from "../lib/constants";

interface UploadProps {
    onComplete?: (base64: string) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const[file,setFile] = useState<File | null>(null);
    const[isDragging, setIsDragging] = useState(false);
    const[progress, setProgress] = useState(0);
    const[error, setError] = useState<string | null>(null);

    const {isSignedIn} = useOutletContext<AuthContext>();

    const processFile = useCallback((selectedFile: File) => {
        if (!isSignedIn) return;

        setError(null);

        if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload a JPEG or PNG image.');
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            setError(`File size exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
            return;
        }

        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();
        const handleReadError = () => {
            setFile(null);
            setProgress(0);
            setError('Failed to read file. Please try again.');
        };
        reader.onerror = handleReadError;
        reader.onabort = handleReadError;
        reader.onload = () => {
            const base64 = reader.result as string;

            let currentProgress = 0;
            let completed = false;
            const interval = setInterval(() => {
                currentProgress = Math.min(currentProgress + PROGRESS_STEP, 100);
                setProgress(currentProgress);

                if (currentProgress >= 100 && !completed) {
                    completed = true;
                    clearInterval(interval);
                    setTimeout(() => {
                        onComplete?.(base64);
                    }, REDIRECT_DELAY_MS);
                }
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(selectedFile);
    }, [isSignedIn, onComplete]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    }, [isSignedIn]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    }, [isSignedIn, processFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    }, [isSignedIn, processFile]);

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input type="file"
                           className="drop-input"
                           accept=".jpg,.png,.jpeg"
                           disabled={!isSignedIn}
                           onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or drag and drop"
                            ):(
                                "Please sign in or Sign up with Puter to upload"
                            )}
                        </p>
                        <p className="help">{`Maximum File Size ${MAX_FILE_SIZE_MB} MB.`} </p>
                        {error && <p className="error">{error}</p>}
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>
                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}}/>

                           <p className="status-text">
                               {progress < 100 ? 'AnalyzingFloor Plan...' : 'Redirecting...'}
                           </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Upload