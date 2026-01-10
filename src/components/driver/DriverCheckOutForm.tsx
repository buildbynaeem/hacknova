import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Gauge, Fuel, ArrowRight, RotateCcw, Check, TrendingDown, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckInData } from './DriverCheckInForm';

interface DriverCheckOutFormProps {
  checkInData: CheckInData;
  onComplete: (data: CheckOutSummary) => void;
  onCancel: () => void;
}

export interface CheckOutSummary {
  checkInData: CheckInData;
  checkOutSelfieUrl: string;
  checkOutOdometer: number;
  checkOutFuel: number;
  checkOutTimestamp: Date;
  kmDriven: number;
  fuelUsed: number;
  avgFuelEfficiency: number; // km per % fuel or L per 100km
}

const DriverCheckOutForm: React.FC<DriverCheckOutFormProps> = ({ checkInData, onComplete, onCancel }) => {
  const [step, setStep] = useState<'selfie' | 'readings' | 'summary'>('selfie');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [summary, setSummary] = useState<CheckOutSummary | null>(null);
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

  const calculateSummary = () => {
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

    const checkOutOdometer = Number(odometerReading);
    const checkOutFuel = Number(fuelLevel);

    if (checkOutOdometer < checkInData.odometerReading) {
      toast.error('Check-out odometer reading cannot be less than check-in reading');
      return;
    }

    const kmDriven = checkOutOdometer - checkInData.odometerReading;
    const fuelUsed = checkInData.fuelLevel - checkOutFuel;
    
    // Calculate average: km per % fuel used
    // Also estimate L/100km assuming full tank is ~50L
    const avgFuelEfficiency = fuelUsed > 0 ? kmDriven / fuelUsed : 0;

    const summaryData: CheckOutSummary = {
      checkInData,
      checkOutSelfieUrl: selfieUrl,
      checkOutOdometer,
      checkOutFuel,
      checkOutTimestamp: new Date(),
      kmDriven,
      fuelUsed,
      avgFuelEfficiency,
    };

    setSummary(summaryData);
    setStep('summary');
  };

  const handleConfirm = () => {
    if (summary) {
      onComplete(summary);
    }
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
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              {step === 'selfie' ? (
                <Camera className="w-4 h-4 text-destructive" />
              ) : step === 'readings' ? (
                <Gauge className="w-4 h-4 text-destructive" />
              ) : (
                <Route className="w-4 h-4 text-destructive" />
              )}
            </div>
            {step === 'selfie' ? 'Check-Out Selfie' : step === 'readings' ? 'Final Vehicle Readings' : 'Trip Summary'}
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
                    className="w-full h-full object-cover"
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
          ) : step === 'readings' ? (
            <>
              {/* Show check-in data for reference */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground mb-2">Check-in readings:</p>
                <div className="flex justify-between">
                  <span>Odometer: <strong>{checkInData.odometerReading.toLocaleString()} km</strong></span>
                  <span>Fuel: <strong>{checkInData.fuelLevel}%</strong></span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="odometer" className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    Current Odometer Reading (km)
                  </Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder={`Min: ${checkInData.odometerReading}`}
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    className="text-lg"
                  />
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
                    placeholder="e.g., 45"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('selfie')} className="flex-1">
                  Back
                </Button>
                <Button onClick={calculateSummary} className="flex-1 gap-2">
                  Calculate
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : summary ? (
            <>
              {/* Trip Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <Route className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-primary">{summary.kmDriven.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">km Driven</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 text-center">
                  <Fuel className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-500">{summary.fuelUsed.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Fuel Used</p>
                </div>
              </div>

              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  {summary.avgFuelEfficiency.toFixed(2)} km/%
                </p>
                <p className="text-xs text-muted-foreground">Average Fuel Efficiency</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({summary.fuelUsed > 0 ? ((summary.fuelUsed * 0.5) / summary.kmDriven * 100).toFixed(1) : 0} L/100km approx.)
                </p>
              </div>

              {/* Comparison */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Odometer:</span>
                  <span className="font-medium">{checkInData.odometerReading.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Odometer:</span>
                  <span className="font-medium">{summary.checkOutOdometer.toLocaleString()} km</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Fuel:</span>
                  <span className="font-medium">{checkInData.fuelLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Fuel:</span>
                  <span className="font-medium">{summary.checkOutFuel}%</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('readings')} className="flex-1">
                  Edit
                </Button>
                <Button onClick={handleConfirm} variant="destructive" className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Go Offline
                </Button>
              </div>
            </>
          ) : null}

          {step !== 'summary' && (
            <Button variant="ghost" onClick={onCancel} className="w-full mt-2">
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DriverCheckOutForm;
