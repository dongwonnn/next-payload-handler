# next-payload-handler &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`next-payload-handler`는 **Next.js의 payload cache key-value를 외부 저장소( Redis, GCS )에 저장하고 관리할 수 있는 라이브러리**입니다.  
Next.js의 캐시 키를 커스텀하고, 이를 Next.js 서버뿐만 아니라 **백엔드/BFF 서버에서도 핸들링할 수 있도록** 도와줍니다.

## 설치
```sh
npm install next-payload-handler
```

## 특징
- **Next.js의 payload key-value를 외부 저장소에 저장**
  - Next.js의 **fetch cache key 및 payload 데이터를 외부 저장소에 저장**하여, **분산된 환경에서도 일관된 캐싱**을 유지할 수 있습니다.
- **커스텀 키 지원 (fetch 옵션의 tag 사용)**
  - `fetch()`의 `tags` 옵션을 활용하여 **캐시 키를 커스텀 가능**.
  - **Next.js 서버가 아닌 백엔드/BFF 서버에서도** Next.js의 캐시를 핸들링할 수 있습니다.
- **간편한 설정**
  - 저장소를 연결하기만 하면 **바로 사용할 수 있습니다**.
  - 기존 Next.js 프로젝트에 **간단하게 추가 가능**.

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

## `initializeHandler` 메서드 (핸들러 설정)

`initializeHandler` 메서드는 특정 타입의 핸들러를 초기화하는 역할을 합니다.  

<table>
  <thead>
    <tr>
      <th>파라미터</th>
      <th>값</th>
      <th>타입</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>type</td>
      <td>redis | gcs</td>
      <td>string</td>
      <td>초기화할 핸들러의 타입입니다. ("redis" 또는 "gcs" 사용 가능)</td>
    </tr>
    <tr>
      <td>initialize</td>
      <td style="width: 18%">
        async redisClient() |<br/>
        async gcsBucket()
      </td>
      <td>function</td>
      <td>핸들러를 생성하고 반환하는 함수입니다.</td>
    </tr>
    <tr>
      <td rowspan="2">options (optional)</td>
      <td>bucketPrefix</td>
      <td>string</td>
      <td>스토리지를 사용할 경우, 저장 경로의 기본 prefix를 지정합니다.</td>
    </tr>
    <tr>
      <td>cacheNamespace</td>
      <td>string</td>
      <td>캐시 키의 네임스페이스를 지정하여 키 충돌을 방지합니다.</td>
    </tr>
  </tbody>
</table>



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

const initialize = async () => {
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

CacheHandler.initializeHandler({ type: 'redis', initialize });

export default CacheHandler;
```

### GCS
### GCS 설치
```sh
npm install @google-cloud/storage
```

### GCS 연결
```ts
// ./cache-handler.mjs
import { CacheHandler } from 'next-payload-hanlder';
import { Storage } from '@google-cloud/storage';

const initialize = async () => {
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID, // GCP 프로젝트 ID
    keyFilename: process.env.GCS_SERVICE_ACCOUNT_KEY // GCS 서비스 계정 키 파일 경로
  });

  const bucketName = process.env.GCS_BUCKET_NAME; // GCS 버킷 이름
  const bucket = storage.bucket(bucketName);

  return bucket;
};

CacheHandler.initializeHandler(
  { 
    type: 'gcs', 
    initialize, 
    options: { bucketPrefix: process.env.GCS_BUCKET_PREFIX } // GCS 버킷 폴더 (optional)
  }
);

export default CacheHandler;
```

### 커스텀 캐시 키 설정
```ts
fetch('/api/data', {
  ...,
  method: 'GET',
  next: { tags: ['custom-key'] },
});
```

### 캐시 키 관리 (BFF/백엔드에서 캐시 삭제)
```ts
const namespace = 'my-namespace'; // 네임스페이스 (없을 경우 생략 가능)
const key = JSON.stringify(namespace ? [`${namespace}:custom-key`] : ['custom-key']);

customHandler.del(key);
```
