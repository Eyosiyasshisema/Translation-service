import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ 
    storage,
    limits: { 
        fileSize: 1024 * 1024 * 5, 
        files: 1 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only document and image files are allowed.'), false);
        }
    }
});