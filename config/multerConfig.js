import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

export const productUpload = multer({
    storage: storage,
    limits: { files: 5 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        };
        cb(null, true);
    }
});

export const getImageExtension = (mimetype) => {
    switch (mimetype) {
        case 'image/jpeg':
        case 'image/jpg':
            return 'jpeg'
        case 'image/png':
            return 'png'
        case 'image/gif':
            return 'gif'
        case 'image/webp':
            return 'webp'
        default:
            return '';
    };
}

export default upload;