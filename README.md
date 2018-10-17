# try-oauth2
Trying OAuth 2.0 based on exercise in "Identify and Data Security for Web Development" published by O'Reilly.

> __WARNING:__ This is not intended to be a complete solution, nor is it expected to be fully secure. Use at your own risk. The only goal here is to demonstrate the OAuth handshake.

## Scenario

This server provides a book API with a user's book data. This API, at `GET /books`, is protected by an OAuth authorization layer. In order to get access to this book data, a third-party must register a _client_ with the API, at `POST /client`, and then the user must grant this client access to their book data via an OAuth handshake.

## Usage

[Install and run MongoDB](https://docs.mongodb.com/manual/administration/install-community/), and then:

```bash
$ npm install
$ npm start # or npm run debug to run with --inspect and more debug output
```

At this point, attempting to `GET /book` will result in a 401 challenge with the `WWW-Authenticate: Bearer` header set.

### 1 Create A Client

Make a POST request to the `/client` endpoint to create an API client:

```
POST /client {
    "clientName": "bob",
    "userId": "user1", // choose from 'user1', 'user2', or 'user3'
    "domain": "localhost",
    "description": "AwesomeSauce App"
}
```

The `userId` represents yourself as a logged-in user to this API platform, which is allowing you to register your third-party application as a _client_, to which book data access will later be granted by an end-user of this platform. 

Response:

```json
{
    "name": "bob",
    "userId": "user1",
    "domain": "localhost",
    "description": "AwesomeSauce App",
    "clientId": "CLIENT_ID", // some identifier
    "clientSecret": "CLIENT_SECRET", // some other identifier
    "createdAt": "2018-10-16T23:05:28.253Z"
}
```

We now have a client, with a client ID and client secret. For testing purposes,

*   `GET /client` will list existing client names
*   `GET /client?name=CLIENT_NAME` will list all properties of a single client

```
GET /client?name=bob # show the response from above
```

### 2 Grant Access

Imagine the user (let's call him Fred) who owns the book data on this platform is wanting to allow Bob, the third-party app for whom we just created a _client_, to showcase those books on a recommended listings page. Fred must grant access to Bob.

While logged into his account on Bob's website, Fred clicks on a "Grant Access" button, also on Bob's website. Clicking this button triggers a `GET /oauth2/authorize` request on this platform:

```
GET /oauth2/authorize?clientId=CLIENT_ID&responseType=code&redirectUri=REDIRECT_URI&scope=SCOPE&state=STATE
```

*   `CLIENT_ID` is the client ID assigned to Bob when we created his client in step 1.
*   `responseType=code` indicates Bob is asking for a temporary access code, which will then be combined with Bob's `CLIENT_SECRET` (known only to Bob) in order to obtain a longer-living API Access Token. The value must be `code` in this scenario.
*   `REDIRECT_URI` is optional, must be within the `domain` that Bob used to register/create his client in step 1, defaults to the originating host (in this implementation), and is where this GET request will be redirected _after Fred logs into his account on this platform and grants access to Bob_. The redirect will include the temporary access code as a URL parameter.
*   `SCOPE` is the type of access Bob is requesting on Fred's book data. This is platform-specific. In this sample, it's either "public" (default), "private", "write", or "writePrivate", each of which have varying degrees of access. "public" is read-only, "private" is read-only including data considered more sensitive, "write" allows read/write of public data, while "writePrivate" allows full control over all type of data.
    *   Note this server doesn't care what the access level is. The different types are just examples. It's up to the implementation to enforce these.
*   `STATE` is optional, can be anything Bob wants to remember after access is granted, and is simply returned as a `state=STATE` parameter to the `redirectUri`.

At this point, a formal implementation of this platform would show Fred a login page (if he's not already logged in), and would then show him a page with information about Bob's app (e.g. the `description` Bob provided when he created his client in step 1) and the level of access Bob is requesting to his data (based on the `scope` parameter in this `GET /oauth2/authorize?...` request).

Assuming Fred accepts (normally by clicking on a button), a temporary authorization code is generated, and this platform makes a GET request to the `redirectUri` specified earlier (i.e. the redirect back to Bob's site):

```
GET REDIRECT_URI?code=AUTH_CODE&state=STATE
```

*   `AUTH_CODE` is the temporary, short-lived (10 minutes in this sample implementation, likely much shorter in practice, but longer here to give you a change to play both Bob and Fred manually).
*   `STATE` is whatever you specified as `STATE` in the `GET /oauth2/authorize?...` request earlier.

In this sample (to make it more usable), if `redirectUri` is _NOT_ specified, a redirect will not take place. Instead, the response will be a JSON object with the state and auth code:

Response:

```json
{
    "state": "STATE",
    "code": "AUTH_CODE"
}
```

### 3 Obtain Access

Using the `AUTH_CODE`, Bob must then obtain an API Token from this platform's API by combining it with his __client secret__ obtained when he registered his _client_ in step 1.

To keep things secure, since the client secret must be protected, Bob must make a POST request over __HTTPS__ (even though this sample doesn't use it), to this platform's `/oauth2/token` endpoint to exchange the auth code for a longer-lasting access token:

```
POST /oauth2/token {
    "grantType": "authorization_code",
    "clientId": "CLIENT_ID", // from Step 1
    "clientSecret": "CLIENT_SECRET", // from Step 1
    "code": "AUTH_CODE" // from Step 2
}
```

At this point, any existing authentication codes issued to Bob's client will be invalidated, and if `AUTH_CODE` matched the one issued in Step 2, Bob will receive his API access token to access Fred's book data on this platform:

```json
{
    "accessToken": "ACCESS_TOKEN", // API access token
    "refreshToken": "REFRESH_TOKEN", // API refresh token
    "expiresAt": 1539792649862, // expiry date/time
    "tokenType": "bearer", // token type
    "scope": "write" // permitted scope
}
```

You'll notice the response contained two types of API tokens: `ACCESS_TOKEN` and `REFRESH_TOKEN`. When the access token expires, Bob can automatically used his refresh token to get a new access token by calling the same `POST /oauth2/token` endpoint, but using the refresh token instead of the original auth code from Step 2:

```
POST /oauth2/token {
    "grantType": "refresh_token",
    "clientId": "CLIENT_ID", // from Step 1
    "clientSecret": "CLIENT_SECRET", // from Step 1
    "refreshToken": "REFRESH_TOKEN" // from Step 3
}
```

This keeps the access token fresh without requiring Fred to re-grant Bob's access. While this sample doesn't do it, we could set a maximum number of refresh token issues for a given client+user pair, at which point Fred would have to re-grant access to Bob, as an extra security measure to make sure Fred still wants to give Bob access to his data.

### 4 Access Book Data

Finally, with the `ACCESS_TOKEN` from Step 3, Bob can access Fred's book data on this platform. Ideally, this is an __HTTPS__ request so that headers are encrypted, though this sample doesn't support HTTPS:

```
Authorization: Bearer ACCESS_TOKEN # header
GET /book
```

Response:

```json
[
    {
        "id": 0,
        "title": "Book 1 title"
    },
    {
        "id": 1,
        "title": "Book 2 title"
    },
    {
        "id": 2,
        "title": "Book 3 title"
    }
]
```
