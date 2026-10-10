# GameDevBuddy AI integrations

Official signed declarative connection profiles for the GameDevBuddy AI host. These profiles select protocols already compiled into the app. They do not install provider software, models, executable plugins, or credentials.

Catalogue: https://raw.githubusercontent.com/GameDevBuddy/gdb-ai-integrations/published/catalogue.json

OpenRouter requires your own API key and may charge for usage. See https://openrouter.ai/docs/quickstart . The llama.cpp profile connects to a separately installed local server: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md . Model availability and tool support depend on the server/model.

## Release

Edit profiles on a reviewed branch and increase major.minor.patch for changes to an existing ID. Run the Publish workflow from main. The workflow validates profiles and signs their exact payload with the repository secret AI_INTEGRATION_SIGNING_KEY, then commits the complete catalogue to the published branch. Publication is serialized and never force-pushed. No PR workflow receives the signing key.

publisher.json is the independent public-key record. The app pins that key; downloading this record never grants trust. The private Ed25519 key is held only as a GitHub Actions repository secret, not in Git or a developer plaintext file. To rotate after loss or compromise, create a new versioned publisher identity, distribute its public key in an app release, then publish packages for that identity. Existing publisher identities cannot silently change keys.
