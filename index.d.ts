/// <reference types="pouchdb-core" />

export interface CryptoStoreOptions {
  noPasswordCheckAutoFix?: boolean;
  remote?: PouchDB.Database;
}

export interface NewObject {
  _id?: string;
}

export interface ObjectWithId {
  _id: string;
}

export interface HoodieDoc {
  _id: string;
  _rev: string;
  _deleted?: boolean;
  hoodie: {
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string;
  };
}

export interface DeletedHoodieDoc extends HoodieDoc {
  _deleted: true;
  hoodie: {
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
  };
}

export interface EncryptedObject {
  nonce: string;
  tag: string;
  data: string;
}

export declare type IdOrDocs<T> = string | (T & ObjectWithId);

/** A Key used to reset a forgotten password. */
export declare type ResetKey = string;
/** 10 ResetKeys */
export declare type ResetKeys = ResetKey[];
/** A 32 Char long hash. */
export declare type Salt = string;

export declare type FilterFunction<T> = (
  doc: T & HoodieDoc,
  index: number,
  array: (T & HoodieDoc)[]
) => boolean;

export interface PasswordChangeResult {
  /** New Salt */
  salt: Salt;
  /** IDs of Documents that couldn't get updated. They are encrypted with a different key. */
  notUpdated: string[];
  /** New resetKeys. */
  resetKeys: ResetKeys;
}

export interface Api<BaseType extends {} = {}> {
  /**
   * Add an array of objects/documents to the store, encrypted.
   * @param properties Objects/documents that should be added encrypted.
   * @returns The decrypted version of the document(s).
   */
  add<T extends BaseType = BaseType & NewObject>(
    properties: T[]
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Add an object/document to the store, encrypted.
   * @param properties Objects/documents that should be added encrypted.
   * @returns The decrypted version of the document(s).
   */
  add<T extends BaseType = BaseType & NewObject>(
    properties: T
  ): Promise<T & HoodieDoc>;

  /**
   * Finds one object/document.
   * @param id Id of the document/object to find.
   */
  find<T extends BaseType>(id: string): Promise<T & HoodieDoc>;
  /**
   * Finds multiple documents/objects in one go.
   * @param idsOrDocs Array of IDs or objects with an ID to find.
   */
  find<T extends BaseType>(
    idsOrDocs: (string | (T & ObjectWithId))[]
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Find an object/document in the store using an existing version of it.
   * @param doc Object with an ID. The ID will be used to find the object.
   */
  find<T extends BaseType>(doc: T & ObjectWithId): Promise<T & HoodieDoc>;

  /**
   * Finds a document/object. If none was found, create it.
   * @param id ID of the document/object to find or add.
   * @param doc Body of the document/object to add if no existing doc could be found.
   */
  findOrAdd<T extends BaseType>(id: string, doc: T): Promise<T & HoodieDoc>;
  /**
   * Finds many documents/objects. If one was not found, create it.
   * @param docs Array of objects with _id.
   */
  findOrAdd<T extends BaseType>(
    docs: (T & ObjectWithId)[]
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Finds a document/object. If none was found, create it.
   * @param doc Object/document with an _id.
   */
  findOrAdd<T extends BaseType>(doc: T & ObjectWithId): Promise<T & HoodieDoc>;

  /**
   * Find all documents/objects.
   * @param filterFunction Optional filter function. Works like Array::filter.
   */
  findAll<T extends BaseType>(
    filterFunction?: FilterFunction<T>
  ): Promise<(T & HoodieDoc)[]>;

  /**
   * Update a document/object.
   * @param id ID of the object/document to update.
   * @param changedProperties Properties/fields that should be updated.
   * @returns The updated decrypted version.
   */
  update<T extends M & BaseType, M extends {} = T>(
    id: string,
    changedProperties: M
  ): Promise<T & HoodieDoc>;
  /**
   * Update a document/object with an update function.
   * @param id ID of the object/document to update.
   * @param updateFunction Function that updates an object using side-effects.
   * @returns The updated decrypted version.
   */
  update<T extends BaseType>(
    id: string,
    updateFunction: (doc: T & HoodieDoc) => void
  ): Promise<T & HoodieDoc>;
  /**
   * Updates multiple documents/objects with provided diffs.
   * @param arrayOfDocs Array of Objects with _id and their changed fields.
   * @returns The updated decrypted versions.
   */
  update<T extends M & BaseType, M extends ObjectWithId = T>(
    arrayOfDocs: M[]
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Updates an object/document with a provided diff.
   * @param doc Object with an _id and the updated fields.
   * @returns The updated decrypted version.
   */
  update<T extends M & BaseType, M extends ObjectWithId = T>(
    doc: M
  ): Promise<T & HoodieDoc>;

  /**
   * Updates an existing object/document or creates a new one.
   * @param id ID of the object/document to update.
   * @param doc Body of the new object or the changed fields.
   */
  updateOrAdd<T extends BaseType>(id: string, doc: T): Promise<T & HoodieDoc>;
  /**
   * Updates or creates multiple documents/objects.
   * @param arrayOfDocs Array of objects with _id and their default values.
   */
  updateOrAdd<T extends ObjectWithId & BaseType>(
    arrayOfDocs: T[]
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Updates an existing object/document or creates a new one.
   * @param doc Object with an _id field and its default/changed fields values.
   */
  updateOrAdd<T extends ObjectWithId & BaseType>(
    doc: T
  ): Promise<T & HoodieDoc>;

  /**
   * Updates all documents.
   * @param changedProperties Fields/properties that should be updated on all documents.
   */
  updateAll<T extends M & BaseType, M extends {} = T>(
    changedProperties: M
  ): Promise<(T & HoodieDoc)[]>;
  /**
   * Updates all documents.
   * @param updateFunction Function that updates every object in place (side effect).
   */
  updateAll<T extends BaseType>(
    updateFunction: (
      doc: T & HoodieDoc,
      index: number,
      array: (T & HoodieDoc)[]
    ) => void
  ): Promise<(T & HoodieDoc)[]>;

  /**
   * Remove/deletes a document/object.
   * @param id Id of the document/object that should be removed.
   */
  remove<T extends BaseType>(id: string): Promise<T & DeletedHoodieDoc>;
  /**
   * Deletes and optional updates multiple documents.
   * @param idsOrDocs Array of ID or object with _id (and their changed fields).
   */
  remove<T extends M & BaseType, M extends ObjectWithId = T>(
    idsOrDocs: (string | M)[]
  ): Promise<(T & DeletedHoodieDoc)[]>;
  /**
   * Remove/deletes a document/object while updating some fields on it.
   * @param doc Object with _id and fields that should be updated.
   */
  remove<T extends M & BaseType, M extends ObjectWithId = T>(
    doc: M
  ): Promise<T & DeletedHoodieDoc>;

  /**
   * Remote all documents.
   * @param filterFunction Optional filter function. Like Array::filter.
   *                       true = Object will get removed.
   */
  removeAll<T extends BaseType>(
    filterFunction?: FilterFunction<T>
  ): Promise<(T & DeletedHoodieDoc)[]>;

  /**
   * Add an `add` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "add",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add an `update` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "update",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add an `remove` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "remove",
    handler: (doc: T & DeletedHoodieDoc) => void
  ): this;
  /**
   * Add an event-handler for all changes. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "change",
    handler: (
      eventName: "add" | "update" | "remove",
      doc: T & HoodieDoc
    ) => void
  ): this;
  /**
   * Add an `add` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "add",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add an `update` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "update",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add an `remove` event-handler. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "remove",
    handler: (doc: T & DeletedHoodieDoc) => void
  ): this;
  /**
   * Add an event-handler for all changes. Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  on<T extends BaseType>(
    eventName: "change",
    handler: (
      eventName: "add" | "update" | "remove",
      doc: T & HoodieDoc
    ) => void
  ): this;

  /**
   * Remove the provided `add` event-handler.
   * @param eventName Name of the subscribed event.
   * @param handler Event Handler function.
   */
  off<T extends BaseType>(
    eventName: "add",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Remove the provided `update` event-handler.
   * @param eventName Name of the subscribed event.
   * @param handler Event Handler function.
   */
  off<T extends BaseType>(
    eventName: "update",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Remove the provided `remove` event-handler.
   * @param eventName Name of the subscribed event.
   * @param handler Event Handler function.
   */
  off<T extends BaseType>(
    eventName: "remove",
    handler: (doc: T & DeletedHoodieDoc) => void
  ): this;
  /**
   * Remove the provided `change` event-handler.
   * @param eventName Name of the subscribed event.
   * @param handler Event Handler function.
   */
  off<T extends BaseType>(
    eventName: "change",
    handler: (
      eventName: "add" | "update" | "remove",
      doc: T & HoodieDoc
    ) => void
  ): this;

  /**
   * Add a one time `add` event-handler.
   * After the first event was emitted, the handler will unsubscribe.
   * Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  one<T extends BaseType>(
    eventName: "add",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add a one time `update` event-handler.
   * After the first event was emitted, the handler will unsubscribe.
   * Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  one<T extends BaseType>(
    eventName: "update",
    handler: (doc: T & HoodieDoc) => void
  ): this;
  /**
   * Add a one time `remove` event-handler.
   * After the first event was emitted, the handler will unsubscribe.
   * Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  one<T extends BaseType>(
    eventName: "remove",
    handler: (doc: T & DeletedHoodieDoc) => void
  ): this;
  /**
   * Add a one time event-handler for all events.
   * After the first event was emitted, the handler will unsubscribe.
   * Events are only emitted for encrypted object/documents.
   * Use Hoodies events or PouchDBs change events for all objects/documents.
   * @param eventName Name of the event to listen to.
   * @param handler Event Handler function.
   */
  one<T extends BaseType>(
    eventName: "change",
    handler: (
      eventName: "add" | "update" | "remove",
      doc: T & HoodieDoc
    ) => void
  ): this;

  /**
   * Get a subset of the CryptoStore API that works on objects/documents with the provided prefix.
   *
   * Add doc added will have the prefix. Find, update and remove only finds docs with that prefix.
   * findAll, updateAll and removeAll are also limited to documents with this prefix.
   * Events are only emitted for documents/objects with this prefix.
   *
   * withIdPrefix of the resulting API will add its prefix to this prefix:
   * ```javascript
   * // _id will be 'test:moar:a'
   * store.withIdPrefix('test:').withIdPrefix('moar:').add({ _id: 'a' })
   * ```
   * @param prefix Prefix that will be added to all _id's.
   */
  withIdPrefix<T extends {} = BaseType>(prefix: string): Api<T>;
}

export interface ApiWithEncrypt<BaseType extends {} = {}>
  extends Api<BaseType> {
  /**
   * Checks if an Objects could be an encrypted object.
   * @param promise Promise that resolves into an Object.
   */
  isEncrypted(promise: Promise<unknown>): Promise<boolean>;
  /**
   * Checks if an Objects could be an encrypted object.
   * @param object Object to check.
   */
  isEncrypted(object: unknown): boolean;

  /**
   * Encrypt any JSON-data without storing them. Uses the same encryption key as any other method.
   * @param object Data that should be encrypted.
   *               This can be anything that can also be passed to JSON.stringify()
   * @param aad    Optional additional validation. If present, then it must also be present and
   *               the same value/content when decrypting.
   */
  encrypt(
    object: unknown,
    aad?: string | Buffer | Uint8Array
  ): Promise<EncryptedObject>;

  /**
   * Decrypt everything encrypted with cryptoStore.encrypt() or any other methods.
   * Uses the same encryption key as any other method.
   *
   * To decrypt an object stored with an other method, use its _id as the aad!
   * `cryptoStore.decrypt(obj, obj._id)`.
   * @param encrypted Data that is encrypted.
   *                  All fields on the object other than data, tag and nonce will be ignored.
   * @param aad Optional additional validation. Required if it was present when encrypting.
   *            _id for all objects encrypted by other methods.
   */
  decrypt<T>(
    encrypted: EncryptedObject,
    aad?: string | Buffer | Uint8Array
  ): Promise<T>;
}

export interface CryptoStore<BaseType extends {} = {}>
  extends ApiWithEncrypt<BaseType> {
  /**
   * Setup encryption. Required on sign up or when encryption is started.
   * @param password The users password for encrypting the objects.
   * @param salt Not recommended! To add another protection lair, as a second password.
   *             If this is missing, a salt will be securely generated. Which will result in a
   *             different encryption!
   * @returns 10 ResetKeys. They are used to reset the password.
   */
  setup(password: string, salt?: Salt): Promise<ResetKeys>;

  /**
   * Unlocks the CryptoStore instance. Required be using it.
   * @param password The users password foe encrypting the objects.
   */
  unlock(password: string): Promise<void>;

  /**
   * Changes the encryption password and salt. Then it will update all encrypted documents.
   * All encrypted documents, that couldn't get decrypted, will not get updated!
   * The Array, at the notUpdated field, will include all their _ids.
   * @param oldPassword The old password, that was used up until now.
   * @param nextPassword New password, with which the docs will be encrypted.
   */
  changePassword(
    oldPassword: string,
    nextPassword: string
  ): Promise<PasswordChangeResult>;

  /**
   * This is for when the user did forget their password.
   * Changes the encryption password and salt. Then it will update all encrypted documents.
   * All encrypted documents, that couldn't get decrypted, will not get updated!
   * The Array, at the notUpdated field, will include all their _ids.
   * @param resetKey One of the resetKeys generated by setup(), changePassword() and resetPassword()
   * @param nextPassword New password, with which the docs will be encrypted.
   */
  resetPassword(
    resetKey: ResetKey,
    nextPassword: string
  ): Promise<PasswordChangeResult>;

  /**
   * Locks the store.
   * `unlock` must then get called again.
   */
  lock(): boolean;

  /**
   * Create a subset of the CryptoStore-API with an other password.
   * All methods will use the provided password. Event only emitted for objects/documents
   * which are encrypted with the provided password.
   *
   * It is recommended to not pass a salt at the _first_ use.
   * But store it! And use the stored _salt_ in subsequent uses.
   * Both _password_ **and** _salt_ must match to work!
   *
   * This can also be used when the main CryptoStore instance is not unlocked!
   * @param password Password used in this sub API.
   * @param salt Salt used in this sub API. A secure salt is generated is non gets passed.
   */
  withPassword<T extends {} = BaseType>(
    password: string,
    salt?: string
  ): Promise<{
    store: ApiWithEncrypt<T>;
    salt: string;
  }>;
}

export interface CryptoStoreConstructor {
  new <Content extends {} = {}>(
    hoodieApi: any,
    options?: CryptoStoreOptions
  ): CryptoStore<Content>;
}

const CryptoStoreConstructor: CryptoStoreConstructor;

export default CryptoStoreConstructor;
