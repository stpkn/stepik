# /// script
# dependencies = [
#   "requests",
#   "rich",
# ]
# ///

import requests
from rich.console import Console
from rich.panel import Panel

console = Console()


def get_cat():
    console.print("[bold yellow]Ищу котика...[/bold yellow]")
    response = requests.get("https://api.thecatapi.com/v1/images/search")
    data = response.json()[0]
    url = data['url']

    console.print(Panel(f"Котик найден! [link={url}]Открыть фото[/link]",
                        title="UV Script Demo",
                        subtitle="Powered by Astral",
                        border_style="green"))


if __name__ == "__main__":
    get_cat()