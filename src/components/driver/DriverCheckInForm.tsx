import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Gauge, Fuel, ArrowRight, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DriverCheckInFormProps {
  onComplete: (data: CheckInData) => void;
  onCancel: () => void;
}

export interface CheckInData {
  selfieUrl: string;
  odometerReading: number;
  fuelLevel: number;
  timestamp: Date;
}

const DriverCheckInForm: React.FC<DriverCheckInFormProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'selfie' | 'readings'>('selfie');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Could not access camera. Please allow camera permissions.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const retakeSelfie = () => {
    setSelfieUrl(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (!selfieUrl) {
      toast.error('Please capture your selfie');
      return;
    }
    if (!odometerReading || isNaN(Number(odometerReading))) {
      toast.error('Please enter a valid odometer reading');
      return;
    }
    if (!fuelLevel || isNaN(Number(fuelLevel)) || Number(fuelLevel) < 0 || Number(fuelLevel) > 100) {
      toast.error('Please enter a valid fuel level (0-100%)');
      return;
    }

    onComplete({
      selfieUrl,
      odometerReading: Number(odometerReading),
      fuelLevel: Number(fuelLevel),
      timestamp: new Date(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {step === 'selfie' ? (
                <Camera className="w-4 h-4 text-primary" />
              ) : (
                <Gauge className="w-4 h-4 text-primary" />
              )}
            </div>
            {step === 'selfie' ? 'Take Your Selfie' : 'Enter Vehicle Readings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'selfie' ? (
            <>
              <div className="aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden bg-muted relative">
                {selfieUrl ? (
                  <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                ) : isCapturing ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-12 h-12 mb-2" />
                    <p className="text-sm">Camera Preview</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!selfieUrl ? (
                  <>
                    {!isCapturing ? (
                      <Button onClick={startCamera} className="flex-1 gap-2">
                        <Camera className="w-4 h-4" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={capturePhoto} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4" />
                        Capture
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={retakeSelfie} className="flex-1 gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Retake
                    </Button>
                    <Button onClick={() => setStep('readings')} className="flex-1 gap-2">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="odometer" className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    Current Odometer Reading (km)
                  </Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="e.g., 45320"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the current km shown on your speedometer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel" className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-muted-foreground" />
                    Current Fuel Level (%)
                  </Label>
                  <Input
                    id="fuel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 75"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Approximate fuel level in your tank (0-100%)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('selfie')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4" />
                  Go Online
                </Button>
              </div>
            </>
          )}

          <Button variant="ghost" onClick={onCancel} className="w-full mt-2">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DriverCheckInForm;
