import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import {
  Plugins,
  CameraResultType,
  Capacitor,
  FilesystemDirectory,
  CameraPhoto,
  CameraSource,
} from '@capacitor/core';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public selectedPhotoPath: string;
  public photos: Photo[] = [];
  public PHOTO_STORAGE: string = 'photos';

  constructor(private platform: Platform) {}

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: this.platform.is('hybrid')
        ? JSON.stringify(this.photos)
        : JSON.stringify(
            this.photos.map((p) => {
              const photoCopy = { ...p };
              delete photoCopy.base64;
              return photoCopy;
            })
          ),
    });
  }

  public async loadSaved() {
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    console.log('photos: ', photos);

    this.photos = JSON.parse(photos.value) || [];
    console.log('Photos JSON parsed: ', this.photos);

    if (!this.platform.is('hybrid')) {
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: FilesystemDirectory.Data,
        });
        photo.base64 = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async savePicture(cameraPhoto: CameraPhoto) {
    const base64Data = await this.readAsBase64(cameraPhoto);

    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath,
      };
    }
  }

  public async deletePicture(photo: Photo, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data,
    });
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: cameraPhoto.path,
      });
      return file.data;
    } else {
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      return (await this.converBlobToBase64(blob)) as string;
    }
  }

  converBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
}

interface Photo {
  filepath: string;
  webviewPath: string;
  base64?: string;
}
