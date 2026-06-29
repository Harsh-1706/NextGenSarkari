async function addJob() {
  const form = document.getElementById("jobForm");
  const data = new FormData(form);

  const payload = Object.fromEntries(data.entries());

  const res = await fetch("/api/add-job", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    }
  });

  console.log(await res.json());
  loadJobs();
}
