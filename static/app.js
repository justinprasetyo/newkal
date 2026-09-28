const userSubject = document.getElementById('daily-subject')
const userSubjectBtn = document.getElementById('daily-subject-btn')

async function getInput(input) {
    const response = await fetch('/api/subjects', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'input': input
        })
    })

    const result = await response.json()
    console.log(result)
}

userSubjectBtn.addEventListener('click', async () => {
        getInput(userSubject.value)

    }
) 