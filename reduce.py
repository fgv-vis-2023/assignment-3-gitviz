import ijson
import csv

data = []

with open("./repo_metadata.json", "rb") as f:
    parser = ijson.parse(f)

    i = 0

    for item in ijson.items(parser, "item"):
        if item["stars"] >= 100:
            data.append(
                {
                    "repo": item["nameWithOwner"],
                    "stars": item["stars"],
                    "forks": item["forks"],
                    "is_archived": item["isArchived"],
                    "language": item["primaryLanguage"],
                    "disk_usage_kb": item["diskUsageKb"],
                    "pull_requests": item["pullRequests"],
                    "watchers": item["watchers"],
                    "created_at": item["createdAt"],
                    "pushed_at": item["pushedAt"],
                    "license": item["license"],
                }
            )
        
        i += 1

        if i % 20000 == 0:
            print(f"{i} repos processed")

with open("./repo_metadata.csv", "w") as f:
    writer = csv.DictWriter(f, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
