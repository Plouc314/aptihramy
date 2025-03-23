<script setup>
import { ref } from "vue";
import axios from "axios";

const file = ref(null);
const imageUrl = ref(null);
const test = ref()
const uploadImage = async () => {
    if (!file.value) {
        alert("Please select an image");
        return;
    }

    const formData = new FormData();
    formData.append("file", file.value);

    try {
        const response = await axios.post("http://127.0.0.1:8000/upload/", formData);
        imageUrl.value = `http://127.0.0.1:8000/images/${response.data.filename}`;
    } catch (error) {
        console.error("Upload failed:", error);
    }
};

function getImage() {

    imageUrl.value = `http://127.0.0.1:8000/images/elec3.png`

}

</script>

<template>
    <v-btn @click="getImage">GET IMAGE</v-btn>
    <input type="file" @change="(event) => (file = event.target.files[0])" />
    <button @click="uploadImage">Upload</button>

    <div v-if="imageUrl">
        <h3>Uploaded Image:</h3>
        <img :src="imageUrl" alt="Uploaded" style="max-width: 300px" />
    </div>
</template>
