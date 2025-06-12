export interface UploadProps {
    title: string;
    uploadFunction: (file: File) => Promise<void>;
}