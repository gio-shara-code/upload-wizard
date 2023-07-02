type Expires = number;

interface RequestSignedUploadUrlResponse {
    url: string;
    expires: Expires;
}


const ImageProviderImageStatus = {
    UPLOADED: "UPLOADED",
    PROCESSED: "PROCESSED",
    NOT_FOUND: "NOT_FOUND",
} as const;

type ImageProviderImageStatus = keyof typeof ImageProviderImageStatus;

const DbImageStatus = {
    REQUESTED: "REQUESTED",
    UPLOADED: "UPLOADED",
} as const;

type DbImageStatus = keyof typeof DbImageStatus;

interface ImageProviderImageResponse<ID> {
    status: ImageProviderImageStatus;
    /* Is `undefined` as long as the image status is not processed */
    url?: string;
}

interface ImageResponse<ID> {
    status: ImageProviderImageStatus | DbImageStatus;
    /* Is `undefined` as long as the image status is not processed */
    url?: string;
}

abstract class ImageProvider<ID> {
    // TODO: Maybe add metaData to this method
    abstract requestSignedUploadUrl(imageId: ID): Promise<RequestSignedUploadUrlResponse>

    abstract confirmUpload(imageId: ID, confirmToken: string): Promise<void>

    abstract getImage(imageId: ID): Promise<ImageProviderImageResponse<ID>>

    abstract deleteImage(imageId: ID): Promise<void>
}

type DefaultID = string;

type Token = string;


interface SignedUploadUrl<ID> {
    id: ID,
    confirmToken: Token,
    url: string,
    expires: Expires,
}

interface CreateImageInput<ID> {
    id: ID;
    confirmToken: Token;
    status: DbImageStatus;
    // metaData: ImageMetaData;
}

abstract class DbProvider<ID> {
    abstract createImage(input: CreateImageInput<ID>): Promise<ID>

    abstract updateImageStatus(imageId: ID, status: DbImageStatus): Promise<void>

    abstract validateConfirmToken(imageId: ID, confirmToken: string): Promise<void>

    abstract deleteImage(imageId: ID): Promise<void>

    abstract imageExists(imageId: ID): Promise<boolean>
}

class ImageUpload<ID = DefaultID> {
    private imageProvider: ImageProvider<ID>;
    private dbProvider: DbProvider<ID>;
    private readonly idGenerator: () => ID;

    constructor(imageProvider: ImageProvider<ID>, dbProvider: DbProvider<ID>, customIdGenerator?: () => ID) {
        this.imageProvider = imageProvider;
        this.dbProvider = dbProvider;

        if (!customIdGenerator) {
            this.idGenerator = () => {
                return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) as ID;
            };
        } else {
            this.idGenerator = customIdGenerator;
        }
    }

    tokenGenerator(): Token {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async signedUploadUrl(): Promise<SignedUploadUrl<ID>> {
        const id = this.idGenerator();

        const {url, expires} = await this.imageProvider.requestSignedUploadUrl(id);

        const confirmToken = this.tokenGenerator();

        await this.dbProvider.createImage({
            id,
            confirmToken,
            status: DbImageStatus.REQUESTED,
        });

        return {
            id,
            confirmToken,
            url,
            expires,
        }
    }

    async confirmUpload(imageId: ID, confirmToken: string): Promise<void> {
        const confirmTokenIsValid = this.dbProvider.validateConfirmToken(imageId, confirmToken);

        if (!confirmTokenIsValid) {
            // TODO: Throw a custom error
            throw new Error("Invalid confirm token");
        }

        await this.dbProvider.updateImageStatus(imageId, DbImageStatus.UPLOADED);

        return this.imageProvider.confirmUpload(imageId, confirmToken);
    }

    async getImage(imageId: ID): Promise<ImageResponse<ID>> {
        const { url, status } = await this.imageProvider.getImage(imageId);

        if (status === ImageProviderImageStatus.NOT_FOUND) {
            const imageExistsInDb = this.dbProvider.imageExists(imageId)

            if (!imageExistsInDb) {
                throw new Error("Image not found");
            }

            return {
                status: DbImageStatus.UPLOADED,
            }
        }

        return {
            url,
            status: status
        }
    }

    async deleteImage(imageId: ID): Promise<void> {
        await this.dbProvider.deleteImage(imageId)
        return this.imageProvider.deleteImage(imageId);
    }
}
