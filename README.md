# next-payload-handler &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`next-payload-handler`는 Next.js의 **데이터 캐시를 외부 저장소(예: Redis, GCS)에 저장하고 관리할 수 있도록 지원하는 라이브러리**입니다.

Next.js의 **캐시 키를 직접 설정**할 수 있으며, 이를 Next.js 서버뿐만 아니라 **백엔드/BFF 서버에서도 활용**할 수 있도록 도와줍니다.

## 특징
### 분산 환경에서 일관된 데이터 캐시 유지
  - Next.js의 데이터 캐시를 서버 내부가 아닌 외부 저장소에 저장하여, **분산 환경에서도 일관된 캐싱**을 유지할 수 있습니다.
### 멀티 핸들러 지원
  - Redis, GCS 등 다양한 핸들러를 동시에 등록하여 사용할 수 있으며, 각 **요청별로 저장할 저장소를 선택**할 수 있습니다.
### 커스텀 키 지원
  - 데이터 fetch 시 **커스텀 캐시 키를 설정**하여, Next.js 서버뿐만 아니라 **백엔드/BFF 서버에서도 캐시를 관리할 수 있도록 지원**합니다.
### Next.js의 기본 캐시 기능(revalidateTag)과 함께 사용 가능
  - Next.js의 `revalidateTag` 기능을 그대로 활용할 수 있으며, 추가적인 캐시 관리 기능을 제공하여 기존 Next.js의 캐시 인프라를 확장할 수 있습니다.

## 사용

### 설치
```sh
npm install next-payload-handler
```

### Custom Cache Handler 설정
```ts
// next.config.js
const nextConfig = {
  cacheHandler: require.resolve("./cache-handler.mjs"),
  cacheMaxMemorySize: 0,
};

module.exports = nextConfig;
```

### CacheHandler 초기화
#### initializeHandler
`initializeHandler` 메서드는 다양한 핸들러를 동시에 초기화할 수 있으며, 필요에 따라 특정 핸들러를 선택하여 사용할 수 있습니다.

### [handlers](#redis-client-예제)
**Type:** `Array` (최소 1개 필수)  
각 핸들러 객체는 다음 속성을 포함함:
- **type** (`redis` | `gcs`)
  - 핸들러의 타입을 지정 (`'redis'`, `'gcs'`)
- **initialize** (`function`)
  - 핸들러를 생성하고 반환하는 비동기 함수
- **options** 
  - **Type:** `object` ( optional )
  - 핸들러별 설정 값
  - **bucketPrefix** 
    - **Type:** ``string``
    - GCS 사용 시, 버킷 내 기본 저장 경로 지정

### defaultHandler
**Type:** `'redis' | 'gcs'`  
**Default:** `'redis'`
- 기본적으로 사용할 핸들러를 지정
- [patch-fetch](https://github.com/dongwonnn/next-payload-handler/blob/7289a34c642c9bb44afeeb92acff0622db636ece/README.md#next-fetch-%ED%99%95%EC%9E%A5) 함수에서 `defaultHandler` 생략 가능

### cacheOptions
**Type:** `object` ( optional )
- **namespace**
  - **Type:** `string`
  - 캐시 키 네임스페이스를 지정하여 키 충돌 방지
  - `${namespace}:${cacheKey}` 형태로 캐시 키 저장
- **cacheMaxSize** 
  - **Type:** `number`
  - **Default:** `2` (MB)
  - 캐시 데이터의 최대 크기 (단위: MB).
  - 기본값은 2MB, 초과 시 캐싱 생략

#### 예제
```ts
CacheHandler.initializeHandler({
  handlers: [
    { type: 'redis', initialize: redisInitialize },
    { type: 'gcs', initialize: gcsInitialize, 
      options: { 
        bucketPrefix: 'next-cache-bucket'
      } 
    },
  ],
  defaultHandler: 'redis',
  cacheOptions: {
    namespace: 'service-A',
    cacheMaxSize: '2',
  }
});
```

### Next fetch 확장
- `patchFetch`를 활용하면 `cacheKey`를 직접 지정하여 관리할 수 있으며, 원하는 핸들러(`redis`, `gcs` 등)를 선택할 수 있습니다.
- `tags` 옵션을 활용하면 **Next.js의 기본 `revalidateTag` 기능을 사용할 수 있으며**, 필요 시 `revalidateTag`를 호출하여 데이터를 갱신할 수 있습니다.

```ts
import { patchFetch } from 'next-payload-handler';

patchFetch('/api/post', {
  ...,
  method: 'GET',
  next: {
    cacheKey: 'custom-key', // 커스텀 캐시 키 지정
    handlerType: 'redis',   // Redis에 캐시 저장 ( defaultHandler 옵션 지정 시 생략 가능 )
    tags: ['post'],         // Next.js의 revalidateTag 기능과 함께 사용 가능
    revalidate: 3600,       // revalidate time 설정
  },
});
```

## 캐시 키 관리 
### BFF/백엔드에서 캐시 삭제
```ts
const namespace = 'my-namespace'; // 네임스페이스 (없을 경우 생략 가능)
const key = JSON.stringify(namespace ? [`${namespace}:custom-key`] : ['custom-key']);

redisHandler.del(key);
```
📌 참고: namespace가 없을 경우, custom-key만 사용하여 캐시를 관리합니다.
이를 활용하면 여러 서비스가 같은 Redis를 사용할 때 키 충돌을 방지할 수 있습니다.

### Next.js의 revalidateTag 사용
- Next.js의 revalidateTag를 활용하여 특정 태그에 해당하는 데이터를 갱신할 수 있습니다.
- fetch 요청 시 tags 옵션을 추가하면, 해당 태그가 revalidate될 때 자동으로 새로운 데이터를 가져옵니다.

```ts
import { revalidateTag } from 'next/cache';

const updatePost = () => {
...,
  revalidateTag('post'); // 'post' 태그에 해당하는 캐시 무효화
};
```

## handler 설정
### 1. Redis Handler
#### Redis 설치
```sh
npm install redis
```

#### Redis 연결
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

### 2. GCS Handler
#### GCS 설치
```sh
npm install @google-cloud/storage
```

#### GCS 연결
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
