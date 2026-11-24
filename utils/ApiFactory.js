class ApiFactory {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        const document = await this.model.create(data);
        return document;
    }

    async findFiltered(filter) {
        const documents = await this.model.find(filter);
        return documents;
    }

    async findAll() {
        const documents = await this.model.find();
        return documents;
    }

    async findById(id) {
        const document = await this.model.findById(id);
        return document;
    }

    async updateById(id, data) {
        const document = await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        return document;
    }
}

return ApiFactory;
