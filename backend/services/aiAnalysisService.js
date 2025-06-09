const { openAIClient } = require('../azureOpenAIClient');

const mentalCheckQuestionsText = [
  'Bisakah Anda memperkenalkan diri dengan jelas?',
  'Apa harapan Anda untuk masa depan?',
];

async function getComprehensiveMentalAnalysis(answers) {
  if (!openAIClient) {
    console.error('Azure OpenAI Client tidak terinisialisasi. Periksa konfigurasi dan log di azureOpenAIClient.js.');
    const serviceError = new Error('Layanan AI tidak tersedia saat ini. Silakan coba lagi nanti.');
    serviceError.status = 503;
    throw serviceError;
  }

  const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  if (!deploymentId) {
    throw new Error('ID Deployment Azure OpenAI untuk Chat Completions belum di-set di environment variables.');
  }

  const systemPrompt = `Anda adalah seorang psikolog AI profesional dan berpengalaman. Tugas Anda adalah menganalisis jawaban pengguna terhadap 30 pertanyaan berikut untuk memberikan gambaran kondisi mental mereka.
  Respons Anda HARUS berupa objek JSON yang valid tanpa markdown atau teks tambahan di luar JSON.
  Struktur JSON yang diharapkan adalah:
  {
    "description": "Deskripsi umum mengenai kondisi pengguna berdasarkan jawaban.",
    "analysis": "Analisis lebih mendalam per aspek yang relevan (misalnya, emosi, stres, coping, hubungan sosial, dll.).",
    "conclusion": "Kesimpulan umum mengenai kondisi mental pengguna.",
    "solution": "Saran konkret atau langkah-langkah yang bisa diambil pengguna untuk memperbaiki atau menjaga kondisi mentalnya. Jika ada indikasi serius, sarankan untuk mencari bantuan profesional."
  }`;

  let userMessagesContent = 'Berikut adalah 30 pertanyaan dan jawaban pengguna:\n\n';
  answers.forEach((answer, index) => {
    userMessagesContent += `Pertanyaan ${index + 1}: ${mentalCheckQuestionsText[index]}\nJawaban Pengguna ${
      index + 1
    }: ${answer || '(tidak dijawab)'}\n\n`;
  });
  userMessagesContent += 'Mohon berikan analisis Anda dalam format JSON yang telah ditentukan.';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessagesContent },
  ];

  try {
    console.log(`Mengirim permintaan ke Azure OpenAI deployment: ${deploymentId}`);
    // Langsung gunakan openAIClient yang sudah diimpor
    const result = await openAIClient.getChatCompletions(deploymentId, messages, {
      // <--- Perubahan di sini
      // maxTokens: 2000,
      // temperature: 0.5,
      // responseFormat: { type: "json_object" } // Aktifkan jika model & SDK Anda mendukung
    });

    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      const aiResponseContent = result.choices[0].message.content;
      console.log('Raw AI Response:', aiResponseContent);

      try {
        const parsedResult = JSON.parse(aiResponseContent);
        if (parsedResult.description && parsedResult.analysis && parsedResult.conclusion && parsedResult.solution) {
          return parsedResult;
        } else {
          console.error('AI response missing required JSON fields after parsing:', parsedResult);
          throw new Error('Respons AI tidak memiliki struktur JSON yang diharapkan.');
        }
      } catch (parseError) {
        console.error('Gagal mem-parsing JSON dari respons AI:', parseError.message);
        console.error('Raw AI response yang gagal diparsing:', aiResponseContent);
        throw new Error(`Respons dari AI tidak dalam format JSON yang valid. Respons mentah: ${aiResponseContent}`);
      }
    } else {
      console.error('Respons tidak valid dari Azure OpenAI:', result);
      throw new Error('Tidak ada pilihan respons yang valid dari Azure OpenAI.');
    }
  } catch (error) {
    console.error(`Error saat memanggil Azure OpenAI (${error.code || 'No Code'}): ${error.message}`);
    const serviceError = new Error(`Gagal mendapatkan analisis dari AI: ${error.message}`);
    serviceError.status = error.statusCode || 500;
    throw serviceError;
  }
}

module.exports = { getComprehensiveMentalAnalysis };
