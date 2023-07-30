import '@nanoslices/spy'
import '@testing-library/jest-dom'

window.localStorage = {
    clear() {
        Object.keys(window.localStorage).forEach((key) => {
            if (key !== 'clear') {
                delete window.localStorage[key]
            }
        })
    }
}
