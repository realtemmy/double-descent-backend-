class Pagination {
  constructor(page, limit) {
    this.page = Math.max(parseInt(page) || 1, 1); // Default to 1 if not provided
    this.limit = Math.max(parseInt(limit) || 10, 1); // Default to 10 if not provided
  }

  // Get the number of items to skip
  get skip() {
    return (this.page - 1) * this.limit;
  }

  // Apply pagination to a Mongoose query
  apply(query) {
    return query.skip(this.skip).limit(this.limit);
  }

  // Format the pagination response
  formatResponse(data, totalItems) {
    const totalPages = Math.ceil(totalItems / this.limit);

    return {
      currentPage: this.page,
      totalPages,
      totalItems,
      perPage: this.limit,
      hasNextPage: this.page < totalPages,
      hasPrevPage: this.page > 1,
      data,
    };
  }
}

module.exports = Pagination;


// setSort(sort) {
//   this.sort = sort || '-createdAt'; // Default sorting by creation date (descending)
//   return this;
// }

// apply(query) {
//   return query.sort(this.sort).skip(this.skip).limit(this.limit);
// }



// const Pagination = require("./Pagination");
// const Product = require("../models/productModel");

// exports.getProducts = catchAsync(async (req, res) => {
//   // Get page and limit from query params
//   const { page, limit } = req.query;

//   // Create an instance of the Pagination class
//   const pagination = new Pagination(page, limit);

//   // Get total count of items
//   const totalItems = await Product.countDocuments();

//   // Fetch paginated data
//   const products = await pagination.apply(Product.find());

//   // Format the response
//   const response = pagination.formatResponse(products, totalItems);

//   // Send response
//   res.status(200).json({
//     status: "success",
//     ...response,
//   });
// });

// {
//   "status": "success",
//   "currentPage": 2,
//   "totalPages": 10,
//   "totalItems": 50,
//   "perPage": 5,
//   "hasNextPage": true,
//   "hasPrevPage": true,
//   "data": [
//     {
//       "_id": "productId1",
//       "name": "Product 1",
//       "price": 99.99
//     },
//     {
//       "_id": "productId2",
//       "name": "Product 2",
//       "price": 49.99
//     }
//   ]
// }
