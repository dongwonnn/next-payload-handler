# next-payload-handler &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`next-payload-handler`는 **Next.js의 payload cache를 외부 저장소( Redis, Storage )에 저장하고 관리할 수 있는 라이브러리**입니다.  
Next.js의 캐시 키를 커스텀해 설정하고, 이를 Next.js 서버뿐만 아니라 **백엔드/BFF 서버에서도 핸들링할 수 있도록** 도와줍니다.

## 설치
```sh
npm install next-payload-handler
```

## 특징
- **Next.js의 payload cache를 외부 저장소에 저장**
  - Next.js의 **fetch cache key 및 payload 데이터를 외부 저장소에 저장**하여, **분산 환경에서도 일관된 캐싱**을 유지
- **멀티 핸들러 지원**
  - Redis, GCS 등 다양한 핸들러를 동시에 등록하여 사용할 수 있으며, 각 요청별로 사용할 핸들러를 선택
- **커스텀 키 지원**
  - patchFetch 함수를 이용해 cacheKey 옵션을 활용하여 캐시 키를 커스텀 가능. 
  - Next.js 서버가 아닌 백엔드/BFF 서버에서도 Next.js의 캐시를 핸들링할 수 있습니다.

## 사용법
### next config 설정
```ts
// next.config.js
const nextConfig = {
  cacheHandler: require.resolve("./cache-handler.mjs"),
  cacheMaxMemorySize: 0,
};

module.exports = nextConfig;
```

## initializeHandler 메서드

`initializeHandler` 메서드는 다양한 핸들러를 동시에 초기화할 수 있으며, 필요에 따라 특정 핸들러를 선택하여 사용할 수 있습니다.

### handlers
**Type:** `Array` (최소 1개 필수)  
각 핸들러 객체는 다음 속성을 포함함:
- **type** (`redis` | `gcs`)
  - 핸들러의 타입을 지정 (`'redis'`, `'gcs'`)
- **initialize** (`function`)
  - 핸들러를 생성하고 반환하는 비동기 함수
- **options** (`object`, 선택사항)
  - 핸들러별 설정 값
  - **bucketPrefix** (`string`)
    - GCS 사용 시, 버킷 내 기본 저장 경로 지정

### defaultHandler
**Type:** `'redis' | 'gcs'`  
**Default:** `'redis'`  
기본적으로 사용할 핸들러를 지정

### cacheOptions
**Type:** `object` (선택사항)
- **namespace** (`string`)
  - 캐시 키 네임스페이스를 지정하여 키 충돌 방지

## 예제
```ts
CacheHandler.initializeHandler({
  handlers: [
    { type: 'redis', initialize: redisInitialize },
    { type: 'gcs', initialize: gcsInitialize, options: { bucketPrefix:  process.env.GCS_BUCKET_PREFIX } },
  ],
  defaultHandler: 'redis',
  cacheOptions: {
    namespace:  process.env.NAMESPACE, 
  }
});
```

## redis
### redis 설치
```sh
npm install redis
```

### redis 연결
```ts
// ./cache-handler.mjs
import { CacheHandler } from 'next-payload-hanlder';
import { createClient } from 'redis';

const redisInitialize = async () => {
    const redisClient = createClient({
        url: process.env.REDIS_URL, 
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));

    redisClient.on('connect', () => {
        console.log('Redis connection successful!');
    });

    await redisClient.connect();
    return redisClient;
};

CacheHandler.initializeHandler({
  handlers: [
    { type: 'redis', initialize: redisInitialize },
  ],
});

export default CacheHandler;
```

## GCS
### GCS 설치
```sh
npm install @google-cloud/storage
```

### GCS 연결
```ts
// ./cache-handler.mjs
import { CacheHandler } from 'next-payload-hanlder';
import { Storage } from '@google-cloud/storage';

const gcsInitialize = async () => {
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID, // GCP 프로젝트 ID
    keyFilename: process.env.GCS_SERVICE_ACCOUNT_KEY // GCS 서비스 계정 키 파일 경로
  });

  const bucketName = process.env.GCS_BUCKET_NAME; // GCS 버킷 이름
  const bucket = storage.bucket(bucketName);

  return bucket;
};

CacheHandler.initializeHandler({
  handlers: [
    { type: 'gcs', initialize: gcsInitialize },
  ],
});

export default CacheHandler;
```

### 캐시 키 설정
```ts
import { patchFetch } from 'next-payload-handler';

patchFetch('/api/post', {
  ...,
  method: 'GET',
  next: { cacheKey: 'custom-key', handlerType: 'redis' },
});
```

### 캐시 키 관리 (BFF/백엔드에서 캐시 삭제)
```ts
const namespace = 'my-namespace'; // 네임스페이스 (없을 경우 생략 가능)
const key = JSON.stringify(namespace ? [`${namespace}:custom-key`] : ['custom-key']);

customHandler.del(key);
```
