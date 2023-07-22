const cloudinary = require("./../utils/cloudinary");
const catchAsync = require("./../utils/catchAsync");
const Category = require("./../models/categoryModel");

// REmember to refactor this uploading of images to a single function in utils/cloudinary
exports.uploadCategoryImage = catchAsync(async (req, res, next) => {
  const imagePath = "./dev-data/images/weave-on.jpg";
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: "category",
    width: 100,
    height: 100,
  });
  console.log(result.secure_url);
  req.body.image = result.secure_url;
  next();
});

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an image! Please upload only images.", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadCategoryImage = upload.single("image");

// exports.resizeCategoryImage = catchAsync(async (req, res, next) => {
//   console.log(req.body);
//   console.log(req.file);

//   if (!req.file) next();

//   // req.file.filename = `category-${Date.now()}.jpeg`

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/categories/category-${Date.now()}.jpeg`);

//   next();
// });

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an image! Please upload only images.", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadCategoryImage = upload.single("image");

// exports.resizeCategoryImage = catchAsync(async (req, res, next) => {
//   // console.log(req.file);
//   if (!req.file) return next();

//   req.body.image = `category-${Date.now()}.jpeg`;

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/categories/${req.body.image}`);

//   next();
// });

exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

exports.getCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id).populate("sections");
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: { newCategory },
  });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(201).json({
    status: "success",
    data: { updatedCategory },
  });
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
