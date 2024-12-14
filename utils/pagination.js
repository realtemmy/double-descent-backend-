class Pagination {
  constructor(page, limit) {
    this.page = Math.max(parseInt(page, 10) || 1, 1);
    this.limit = Math.max(parseInt(limit, 10) || 10, 1);
    this.sort = "-createdAt"; // Default sorting by creation date (descending)
  }

  setSort(sort) {
    this.sort = sort || "-createdAt";
    return this;
  }

  // Get the number of items to skip
  get skip() {
    return (this.page - 1) * this.limit;
  }

  // Apply pagination and sorting to a Mongoose query
  apply(query) {
    return query.sort(this.sort).skip(this.skip).limit(this.limit);
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
