export interface CameraState {
  hasPermission: boolean;
  isStreaming: boolean;
  facingMode: 'environment' | 'user';
  torchSupported: boolean;
  torchOn: boolean;
  error: string | null;
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private currentFacingMode: 'environment' | 'user' = 'environment';
  private torchState = false;

  public async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'environment' | 'user' = 'environment'
  ): Promise<{ success: boolean; torchSupported: boolean; error?: string }> {
    this.stopCamera();
    this.currentFacingMode = facingMode;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      videoElement.srcObject = stream;

      const [track] = stream.getVideoTracks();
      this.videoTrack = track || null;

      // Check if torch/flashlight is supported
      let torchSupported = false;
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
        torchSupported = !!capabilities.torch;
      }

      await videoElement.play();
      return { success: true, torchSupported };
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMsg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is already in use by another application.';
      }
      return { success: false, torchSupported: false, error: errorMsg };
    }
  }

  public async toggleTorch(): Promise<boolean> {
    if (!this.videoTrack) return false;
    try {
      const capabilities = (this.videoTrack.getCapabilities?.() || {}) as { torch?: boolean };
      if (capabilities.torch) {
        this.torchState = !this.torchState;
        await this.videoTrack.applyConstraints({
          advanced: [{ torch: this.torchState } as any]
        });
        return this.torchState;
      }
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
    return false;
  }

  public async switchCamera(videoElement: HTMLVideoElement): Promise<{ success: boolean; torchSupported: boolean }> {
    const nextMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    return await this.startCamera(videoElement, nextMode);
  }

  public captureFreezeFrame(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.error('Failed to capture freeze frame:', e);
      return null;
    }
  }

  public stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.videoTrack = null;
    this.torchState = false;
  }

  public getFacingMode(): 'environment' | 'user' {
    return this.currentFacingMode;
  }
}

export const cameraService = new CameraService();
