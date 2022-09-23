import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL,
    withCredentials: true,
});

export const makeRequest = (url, options) => {
    return API(url, options)
        .then(response => response.data)
        .catch(error => Promise.reject(error?.response?.data?.message ?? "Error"));
};