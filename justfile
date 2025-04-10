# Run the script
run:
    deno run --allow-env --allow-read --allow-net main.ts

# Run the script with a different model
# Note: This one doesn't use Deno.args for the prompt, so '+' might not be needed
# unless you intend to pass other arguments.
run-model model:
    deno run --allow-env --allow-read --allow-net main.ts --model {{model}}

# Run the script with watch mode for development
watch:
    deno run --allow-env --allow-read --allow-net --watch main.ts

# Run with environment variables from .env file
run-with-env:
    deno run --allow-env --allow-read --allow-net --env-file=.env main.ts
