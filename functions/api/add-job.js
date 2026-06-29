async function addJob() {
  const payload = {
    title: document.getElementById("title").value,
    department: document.getElementById("department").value,
    state: document.getElementById("state").value,
    last_date: document.getElementById("last_date").value,
    description: document.getElementById("description").value,
    apply_link: document.getElementById("apply_link").value,
    slug: document.getElementById("slug").value
  };

  console.log("SENDING:", payload);

  const res = await fetch("/api/add-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log(await res.json());
  loadJobs();
}
