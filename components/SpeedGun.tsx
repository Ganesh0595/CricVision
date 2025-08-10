
import React, { useState, useRef, useEffect, useMemo } from 'react';

type Stage = 'setup' | 'camera' | 'analysis' | 'result';

interface SpeedGunProps {
    onShowToast: (message: string, type: 'success' | 'error') => void;
}

const FRAME_STEP = 1 / 30; // Assume 30 FPS for stepping

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md ${className}`}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
            {children}
        </div>
    </div>
);

const MeasurementGuideDiagram: React.FC = () => (
    <svg viewBox="0 0 300 150" className="w-full h-auto rounded-lg bg-slate-100 dark:bg-slate-700/50 p-2">
        <defs>
            <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto">
                <polygon points="0 0, 5 1.75, 0 3.5" className="fill-current text-rose-500" />
            </marker>
        </defs>

        {/* Pitch */}
        <rect x="20" y="60" width="260" height="30" className="fill-green-200 dark:fill-green-800/50" />
        <line x1="20" y1="75" x2="280" y2="75" strokeDasharray="2 2" className="stroke-white/50" />

        {/* Stumps */}
        <g className="fill-amber-600 dark:fill-amber-400">
            <rect x="35" y="50" width="2" height="10" />
            <rect x="263" y="50" width="2" height="10" />
        </g>
        <text x="36" y="45" textAnchor="middle" className="text-[8px] fill-slate-700 dark:fill-slate-300">Bowler</text>
        <text x="264" y="45" textAnchor="middle" className="text-[8px] fill-slate-700 dark:fill-slate-300">Batter</text>

        {/* Ball Path */}
        <line x1="60" y1="70" x2="250" y2="70" className="stroke-rose-500" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
        <text x="155" y="65" textAnchor="middle" className="text-[8px] font-semibold fill-rose-500">Ball Path</text>
        
        {/* Markers */}
        <g className="fill-sky-600 dark:fill-sky-400">
            <circle cx="60" cy="70" r="2" />
            <circle cx="250" cy="70" r="2" />
        </g>
        <text x="60" y="85" textAnchor="middle" className="text-[8px] fill-slate-700 dark:fill-slate-300">Release Point</text>
        <text x="250" y="85" textAnchor="middle" className="text-[8px] fill-slate-700 dark:fill-slate-300">Reach Point</text>

        {/* Distance */}
        <line x1="60" y1="95" x2="250" y2="95" className="stroke-slate-500" />
        <line x1="60" y1="92" x2="60" y2="98" className="stroke-slate-500" />
        <line x1="250" y1="92" x2="250" y2="98" className="stroke-slate-500" />
        <text x="155" y="105" textAnchor="middle" className="text-[9px] font-bold fill-slate-700 dark:fill-slate-300">Distance (d)</text>

        {/* Camera */}
        <g transform="translate(155, 125)">
            <rect x="-15" y="-8" width="30" height="16" rx="3" className="fill-slate-600 dark:fill-slate-300" />
            <circle cx="0" cy="0" r="5" className="fill-sky-400 dark:fill-sky-600" />
            <circle cx="0" cy="0" r="2" className="fill-slate-800 dark:fill-slate-200" />
        </g>
        <text x="155" y="145" textAnchor="middle" className="text-[9px] font-bold fill-slate-800 dark:fill-slate-200">
            Camera Position (Side-on & Stable)
        </text>
    </svg>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
      isActive
        ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }`}
  >
    {children}
  </button>
);


export const SpeedGun: React.FC<SpeedGunProps> = ({ onShowToast }) => {
    const [activeTab, setActiveTab] = useState<'guideline' | 'measure'>('measure');
    const [stage, setStage] = useState<Stage>('setup');
    const [distance, setDistance] = useState('20.12'); // Standard pitch length in meters
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [calculatedSpeed, setCalculatedSpeed] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    
    const recordedVideoUrl = useMemo(() => {
        if (recordedBlob) {
            return URL.createObjectURL(recordedBlob);
        }
        return null;
    }, [recordedBlob]);

    // Effect to handle camera stream attachment
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (stage === 'camera' && stream) {
            videoEl.srcObject = stream;
            videoEl.play().catch(e => {
                console.error("Error playing video stream:", e);
                onShowToast('Could not start camera preview.', 'error');
            });
        } else {
            videoEl.srcObject = null;
        }
    }, [stage, stream]);

    const startCamera = async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setRecordedBlob(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            setStream(mediaStream);
            setStage('camera');
        } catch (error) {
            console.error("Error accessing camera:", error);
            onShowToast('Could not access camera. Please check permissions.', 'error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleStartRecording = () => {
        if (!stream || !stream.active) {
            onShowToast('Camera stream is not active. Cannot record.', 'error');
            return;
        }
        setIsRecording(true);
        const chunks: Blob[] = [];
        try {
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setRecordedBlob(blob);
                setStage('analysis');
                stopCamera();
            };
            mediaRecorderRef.current.start();
        } catch(e) {
            console.error("MediaRecorder error:", e);
            onShowToast("Recording failed. Your browser might not support it.", 'error');
            setIsRecording(false);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleStep = (direction: 'forward' | 'backward') => {
        if (videoRef.current) {
            videoRef.current.currentTime += direction === 'forward' ? FRAME_STEP : -FRAME_STEP;
        }
    };

    const handleMarkTime = (type: 'start' | 'end') => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            if (type === 'start') {
                if (endTime && currentTime >= endTime) {
                    onShowToast('Release point must be before reach point.', 'error');
                    return;
                }
                setStartTime(currentTime);
            } else {
                if (startTime === null || currentTime <= startTime) {
                    onShowToast('Reach point must be after release point.', 'error');
                    return;
                }
                setEndTime(currentTime);
            }
        }
    };

    const calculate = () => {
        if (startTime !== null && endTime !== null) {
            const timeDiff = endTime - startTime;
            const dist = parseFloat(distance);
            if (timeDiff > 0 && dist > 0) {
                const speedMps = dist / timeDiff; // meters per second
                const speedKmph = speedMps * 3.6;
                setCalculatedSpeed(speedKmph);
                setStage('result');
            } else {
                onShowToast('Invalid distance or time difference.', 'error');
            }
        }
    };

    const reset = () => {
        stopCamera();
        setRecordedBlob(null);
        setStartTime(null);
        setEndTime(null);
        setCalculatedSpeed(null);
        setStage('setup');
    };

    useEffect(() => {
        return () => {
            stopCamera();
            if (recordedVideoUrl) {
                URL.revokeObjectURL(recordedVideoUrl);
            }
        };
    }, [recordedVideoUrl]);


    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Cricket Ball Speed Gun</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Measure the speed of a delivery using your device's camera.</p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="flex space-x-1 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-xl">
                        <TabButton isActive={activeTab === 'measure'} onClick={() => setActiveTab('measure')}>Measure Speed</TabButton>
                        <TabButton isActive={activeTab === 'guideline'} onClick={() => setActiveTab('guideline')}>Guideline</TabButton>
                    </div>
                </div>

                {activeTab === 'guideline' && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-0">
                         <InfoCard title="How to Measure Accurately">
                            <MeasurementGuideDiagram />
                            <ul className="list-disc list-inside text-left space-y-2 mt-4">
                                <li><strong className="font-semibold">Position:</strong> Place your camera side-on to the pitch, as shown above. Avoid filming from behind the bowler or batter.</li>
                                <li><strong className="font-semibold">Stability:</strong> Keep the camera as still as possible. Using a tripod is highly recommended for best results.</li>
                                <li><strong className="font-semibold">Framing:</strong> Ensure both the release point and the reach point (stumps) are clearly visible in the frame throughout the recording.</li>
                            </ul>
                        </InfoCard>

                        <InfoCard title="Instructions">
                            <ol className="list-decimal list-inside text-left space-y-2">
                                <li>Set the distance in the 'Measure Speed' tab. The default is a standard 22-yard pitch.</li>
                                <li>Record the delivery from the moment the ball is released to when it reaches the stumps.</li>
                                <li>After recording, you will mark these two points in the video to calculate the speed.</li>
                            </ol>
                        </InfoCard>
                    </div>
                )}
                
                {activeTab === 'measure' && (
                    <div className="animate-in fade-in-0">
                        {stage === 'setup' && (
                            <div className="max-w-2xl mx-auto text-center space-y-6">
                                <p className="text-slate-500 dark:text-slate-400">For an accurate reading, please provide the distance the ball travels.</p>
                                <div className="w-full max-w-sm mx-auto">
                                    <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distance (meters)</label>
                                    <input type="number" id="distance" value={distance} onChange={e => setDistance(e.target.value)} className="mt-1 w-full p-3 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg" required />
                                </div>
                                <button onClick={startCamera} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-transform hover:scale-105">
                                    Start Camera
                                </button>
                            </div>
                        )}

                        {(stage === 'camera' || stage === 'analysis') && (
                            <div className="max-w-4xl mx-auto space-y-4">
                                <video 
                                    ref={videoRef} 
                                    src={stage === 'analysis' ? recordedVideoUrl! : ''}
                                    autoPlay={stage === 'camera'} 
                                    playsInline 
                                    muted={stage === 'camera'} 
                                    controls={stage === 'analysis'} 
                                    className="w-full rounded-lg bg-black aspect-video shadow-lg"
                                ></video>
                                {stage === 'camera' && (
                                    <div className="text-center">
                                        <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${isRecording ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                                        </button>
                                    </div>
                                )}
                                {stage === 'analysis' && (
                                    <InfoCard title="Analysis">
                                        <p>Use the video controls to find the exact frames. Step frame-by-frame for precision.</p>
                                        <div className="flex justify-center gap-4 my-4">
                                            <button onClick={() => handleStep('backward')} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md font-semibold">&lt; Prev Frame</button>
                                            <button onClick={() => handleStep('forward')} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md font-semibold">Next Frame &gt;</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <button onClick={() => handleMarkTime('start')} className="w-full py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700">Mark Release Point</button>
                                            <p className="text-center font-mono">Time: {startTime?.toFixed(3) ?? 'Not set'}</p>
                                            <button onClick={() => handleMarkTime('end')} className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700">Mark Reach Point</button>
                                            <p className="text-center font-mono">Time: {endTime?.toFixed(3) ?? 'Not set'}</p>
                                        </div>
                                        <div className="mt-6 flex justify-center">
                                            <button onClick={calculate} disabled={startTime === null || endTime === null} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed">
                                                Calculate Speed
                                            </button>
                                        </div>
                                    </InfoCard>
                                )}
                            </div>
                        )}
                        
                        {stage === 'result' && (
                            <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in-0 zoom-in-95">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Result</h2>
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-full aspect-square w-64 h-64 mx-auto flex flex-col justify-center items-center shadow-2xl border-8 border-indigo-500">
                                    <span className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">{calculatedSpeed?.toFixed(1)}</span>
                                    <span className="text-xl font-semibold text-slate-600 dark:text-slate-300">km/h</span>
                                </div>
                                <div className="flex justify-center gap-8 text-slate-500 dark:text-slate-400">
                                    <p><strong>Distance:</strong> {distance} m</p>
                                    <p><strong>Time:</strong> {(endTime! - startTime!).toFixed(3)} s</p>
                                </div>
                                <button onClick={reset} className="px-8 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-transform hover:scale-105">
                                    Measure Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
