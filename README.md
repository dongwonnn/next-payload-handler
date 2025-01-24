# next-payload-handler &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

`next-payload-handler`는 **Next.js의 payload cache key-value를 Redis에 저장하고 관리할 수 있는 라이브러리**입니다.  
Next.js의 캐시 키를 커스텀하고, 이를 Next.js 서버뿐만 아니라 **백엔드/BFF 서버에서도 핸들링할 수 있도록** 도와줍니다.

## 설치
```sh
npm install next-payload-handler
```

## 특징
- **Next.js의 payload key-value를 Redis에 저장**
  - Next.js의 **fetch cache key 및 payload 데이터를 Redis에 저장**하여, **분산된 환경에서도 일관된 캐싱**을 유지할 수 있습니다.
- **커스텀 키 지원 (fetch 옵션의 tag 사용)**
  - `fetch()`의 `tags` 옵션을 활용하여 **캐시 키를 커스텀 가능**.
  - **Next.js 서버가 아닌 백엔드/BFF 서버에서도** Next.js의 캐시를 핸들링할 수 있습니다.
- **간편한 설정**
  - Redis 정보만 설정하면 **바로 사용할 수 있습니다**.
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

### redis 연결
```ts
import { CacheHandler } from 'next-payload-hanlder';
import { createClient } from 'redis';

const createHandler = async () => {
  const redisClient = createClient({
    url: process.env.REDIS_URL, 
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  });

  redisClient.on('connect', () => {
    console.log('Redis connection successful!');
  });

  await redisClient.connect();
  return redisClient;
};

CacheHandler.initializeHandler(createHandler);

export default CacheHandler;
```

### 커스텀 캐시 키 설정
```ts
fetch('/api/data', {
  next: { tags: ['custom-key'] },
});
```

### 캐시 키 관리 (BFF/백엔드에서 캐시 삭제)
```ts
redisClient.del('custom-key')
```
