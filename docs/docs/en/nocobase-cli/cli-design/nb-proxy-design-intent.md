# The design intent of `nb proxy`

The purpose of `nb proxy` is to provide users with a set of simpler and more stable commands from the originally complex entry layer process.

If we only talk about the core process, it is enough to remember these 3 commands:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

In most scenarios, what you use `nb proxy` to do is essentially these three steps:

1. First use `use` to select the running mode of the current provider
2. Then use `generate` to generate entry configuration according to env and domain name
3. Finally use `reload` to make the configuration take effect

If you are using Caddy, just replace `nginx` in the command with `caddy`.

`use local` and `use docker` can also be written directly like this:

- If Nginx or Caddy has been installed locally, use `use local`
- There is no local installation. If you are going to let CLI use Docker to manage the agent, use `use docker`

This is also the experience that this layer of `nb proxy` most wants to provide: you don’t need to get into the configuration details of Nginx or Caddy first, just connect the entrance according to the fixed process.

## Why is it enough to remember these 3 items first?

Because the problem solved by `nb proxy` is actually very convergent: **Give the application a stable external access entrance. **

If you have already seen [Production Environment Deployment Overview](../production/index.md), you can remember it separately from `nb app autostart` like this:

- `nb app autostart` is in charge of "how to resume running the application after the machine is restarted"
- `nb proxy` is in charge of "how the application can provide stable external access through Nginx or Caddy"

So in the most common deployment process, `nb proxy` doesn't require a bunch of minds. Most of the time it’s:

- Select operating mode
- Generate configuration
- Reloading takes effect

Enough.

## What are these three steps doing?

### `use`

`use` solves the problem of "how to manage the agent currently".

for example:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

The simplest way to judge is:

- If Nginx or Caddy has been installed locally, use `use local`
- If it is not installed locally, use `use docker`

You can also think of it as first selecting the default running mode of the current provider. The following commands `start`, `reload`, and `status` will work in this way.

### `generate`

`generate` solves the problem of "rendering the entry configuration according to the current env".

for example:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

This step will combine the information in env with the parameters required by the entry layer to generate a usable proxy configuration. The most critical input here is usually:

- `--env`: Which CLI managed env to expose
- `--host`: Which domain name to bind to

In other words, `generate` manages configuration products, not process status.

### `reload`

`reload` solves the problem of "making the newly generated configuration truly effective".

```bash
nb proxy nginx reload
```

This separation has a direct benefit: configuration generation and process actions are not mixed. When you change the domain name, port or public path, regenerate it first and then decide to make it take effect. The whole process will be clearer.

## Why should it be designed as `use → generate → reload`

Because these three steps just correspond to the three most stable actions of the entrance layer:

- Decide first how to run the agent
- Then decide what entry to generate for which env
-Finally let the configuration take effect

If you put all these steps into a black box command, it will appear that there are fewer commands on the surface. However, once a problem occurs, it is difficult to determine whether the driver is selected incorrectly, the configuration is not generated correctly, or the agent has not been reloaded.

Now after disassembling it like this, the investigation path will be straighter:

- `use` If it’s wrong, just cut the driver
- `generate` is incorrect, regenerate the configuration.
- The configuration is correct but it has not taken effect yet, just `reload`

## What are the advantages of this layer of design?

The advantage of `nb proxy` is not only to unify the command forms of Nginx and Caddy, but more importantly, to make the high-frequency actions of the entry layer into a composable process.

For example, you can start directly from the agent entrance:

```bash
nb proxy nginx generate --env test2 --reload
```

You can also start from the application configuration:

```bash
nb env update --env test2 --app-port 13000 --proxy-generate --proxy-reload
```

These two examples correspond to two very common starting points:

- You already know that you are changing the entrance layer, so just `generate --reload`
- You changed env first, then trigger `--proxy-generate --proxy-reload`

But in the end, they all fall into the same stable process: update the configuration, generate the entrance, and let the agent take effect.

## Why do we need a separate `nb proxy`

Because what `nb proxy` wants to unify is not a certain Nginx configuration file, but the common actions of the entry layer.

What you really care about is usually not:

-Which path does the configuration file fall in?
- Command differences between Nginx and Caddy
- Operational differences between local and docker

What you are more concerned about is:

- How do I expose this env?
- How do I change my domain name?
- How do I make the new configuration take effect?

`nb proxy` is to converge these actions into the same set of CLI entries. In this way, if you remember the core process first, you can already cover most scenarios. Only when you want to continue troubleshooting the details or need special configuration, just look down at the provider's own page.

## Overall

- `nb proxy` The core use of mind is `use → generate → reload`
- For most users, remembering these 3 commands is enough
- The focus of its design is not to hide all details, but to first fix the most common entrance level processes.

If you want to continue looking at the specific commands, you can go directly to [`nb proxy`](../../api/cli/proxy/index.md). If you are ready to connect to the official entrance, you can also continue to look at [Reverse Proxy](../production/reverse-proxy/index.md).
