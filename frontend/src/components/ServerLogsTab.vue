<template>
  <div class="space-y-6">
    <!-- Feature Introduction with Video/Tutorial -->
    <div class="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-2xl p-6">
      <div class="flex items-start space-x-4">
        <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-white mb-2">📺 Watch Your Server Live!</h3>
          <p class="text-sm text-gray-300 mb-3 leading-relaxed">
            See everything happening on your server in real-time - like having a live TV feed of your server's activities. 
            Watch errors, visitor logs, and system events as they happen!
          </p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg border border-green-500/30">
              ✅ Completely FREE
            </span>
            <span class="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30">
              🔒 Bank-Level Security
            </span>
            <span class="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/30">
              ⚡ Updates Every Second
            </span>
          </div>
          
          <!-- Quick Explanation -->
          <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <p class="text-xs text-gray-300 mb-2">
              <strong class="text-white">🎯 What you'll see:</strong>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
              <div class="flex items-center space-x-2">
                <span class="text-green-400">✓</span>
                <span>Website visitors and their activity</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-green-400">✓</span>
                <span>Errors and crashes (so you can fix them)</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-green-400">✓</span>
                <span>Login attempts (security monitoring)</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-green-400">✓</span>
                <span>Your application's messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup Status -->
    <div v-if="!sshConfigured" class="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
      <div class="flex items-start space-x-4">
        <div class="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-yellow-400 mb-2">⚠️ Setup Required (One-Time Only)</h3>
          <p class="text-sm text-gray-300 mb-4">
            You need to connect this server once. After that, you can watch logs anytime with just one click!
          </p>
          <button
            @click="showSSHSetup = !showSSHSetup"
            class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{{ showSSHSetup ? '❌ Cancel Setup' : '🚀 Start Setup Now (Takes 2 Minutes)' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Already Configured Banner -->
    <div v-else class="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-6">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-green-400 mb-1">✅ Ready to Watch Logs!</h3>
            <p class="text-sm text-gray-300">
              Your server is connected. Select what you want to watch below and click Start.
            </p>
          </div>
        </div>
        <button
          @click="removeSSHCredentials"
          class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg text-sm font-medium transition"
        >
          🗑️ Disconnect
        </button>
      </div>
    </div>

    <!-- Step-by-Step Setup Guide -->
    <div v-if="showSSHSetup && !sshConfigured" class="space-y-6">
      
      <!-- Progress Indicator -->
      <div class="bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-700/50">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-white font-bold text-lg">📋 Setup Progress</h4>
          <span class="text-sm text-gray-400">{{ setupProgress }}% Complete</span>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            :style="{ width: setupProgress + '%' }"
          ></div>
        </div>
        
        <!-- Steps Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div :class="['p-3 rounded-lg border-2 transition', 
            sshForm.username ? 'bg-green-500/10 border-green-500/50' : 'bg-gray-800/50 border-gray-700']">
            <div class="flex items-center space-x-2">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                sshForm.username ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400']">
                {{ sshForm.username ? '✓' : '1' }}
              </div>
              <span :class="['text-sm font-medium', sshForm.username ? 'text-green-400' : 'text-gray-400']">
                Username
              </span>
            </div>
          </div>
          
          <div :class="['p-3 rounded-lg border-2 transition', 
            sshForm.port === 22 ? 'bg-green-500/10 border-green-500/50' : 'bg-gray-800/50 border-gray-700']">
            <div class="flex items-center space-x-2">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                sshForm.port === 22 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400']">
                {{ sshForm.port === 22 ? '✓' : '2' }}
              </div>
              <span :class="['text-sm font-medium', sshForm.port === 22 ? 'text-green-400' : 'text-gray-400']">
                Port (Auto-filled)
              </span>
            </div>
          </div>
          
          <div :class="['p-3 rounded-lg border-2 transition', 
            sshForm.privateKey ? 'bg-green-500/10 border-green-500/50' : 'bg-gray-800/50 border-gray-700']">
            <div class="flex items-center space-x-2">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                sshForm.privateKey ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400']">
                {{ sshForm.privateKey ? '✓' : '3' }}
              </div>
              <span :class="['text-sm font-medium', sshForm.privateKey ? 'text-green-400' : 'text-gray-400']">
                Security Key
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 0: AWS Security Group (Moved up and more prominent) -->
      <div class="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-2xl p-6">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🛡️</span>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-bold text-white mb-2">
              <span class="inline-block w-8 h-8 bg-red-500 text-white rounded-full text-center leading-8 font-bold mr-2">!</span>
              IMPORTANT: Open AWS Firewall First
            </h4>
            <p class="text-sm text-gray-300 mb-4">
              Before you fill the form below, you MUST do this in AWS or the connection will fail:
            </p>
            
            <div class="bg-gray-900/50 rounded-xl p-4 space-y-3">
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-indigo-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">1</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Go to AWS Console</p>
                  <p class="text-xs text-gray-400">Open aws.amazon.com in a new tab and sign in</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-indigo-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">2</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Find "Security Groups"</p>
                  <p class="text-xs text-gray-400">Click Services → EC2 → Security Groups (in left menu)</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-indigo-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">3</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Select Your Server's Security Group</p>
                  <p class="text-xs text-gray-400">Click on the security group used by {{ server.name }}</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-indigo-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">4</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Click "Edit inbound rules"</p>
                  <p class="text-xs text-gray-400">Then click "Add rule" button</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-indigo-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">5</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Add SSH Rule</p>
                  <div class="mt-2 bg-gray-800 rounded p-2 text-xs font-mono text-green-400 space-y-1">
                    <div>Type: <span class="text-white">SSH</span></div>
                    <div>Port: <span class="text-white">22</span></div>
                    <div>Source: <span class="text-white">0.0.0.0/0</span> (allows from anywhere)</div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <span class="inline-block w-6 h-6 bg-green-500 text-white rounded-full text-center text-sm leading-6 font-bold flex-shrink-0">✓</span>
                <div class="flex-1">
                  <p class="text-white font-semibold mb-1">Click "Save rules"</p>
                  <p class="text-xs text-gray-400">Done! Now come back here and continue below</p>
                </div>
              </div>
            </div>
            
            <div class="mt-4 flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-xs text-blue-300">
                <strong>Why?</strong> This is like unlocking your door so CloudEvy can knock and ask for logs. Without this, the connection will be blocked.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 1: Username -->
      <div class="bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-700/50">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
            1
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-bold text-white mb-2">Enter Your Server Username</h4>
            <p class="text-sm text-gray-400 mb-4">
              This is like your server's "login name". It depends on what type of server you have.
            </p>
            
            <input
              v-model="sshForm.username"
              type="text"
              placeholder="ec2-user"
              class="w-full px-4 py-4 bg-gray-900/50 border-2 border-gray-700 rounded-xl text-white text-lg font-medium focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
            
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                @click="sshForm.username = 'ec2-user'"
                :class="['p-4 rounded-xl border-2 transition text-left',
                  sshForm.username === 'ec2-user' 
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-lg' 
                    : 'bg-gray-900/50 border-gray-700 hover:border-indigo-500/50']"
              >
                <div class="font-semibold text-white mb-1">Amazon Linux</div>
                <div class="text-xs text-gray-400">Use: <span class="text-green-400 font-mono">ec2-user</span></div>
              </button>
              
              <button
                @click="sshForm.username = 'ubuntu'"
                :class="['p-4 rounded-xl border-2 transition text-left',
                  sshForm.username === 'ubuntu' 
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-lg' 
                    : 'bg-gray-900/50 border-gray-700 hover:border-indigo-500/50']"
              >
                <div class="font-semibold text-white mb-1">Ubuntu</div>
                <div class="text-xs text-gray-400">Use: <span class="text-green-400 font-mono">ubuntu</span></div>
              </button>
              
              <button
                @click="sshForm.username = 'centos'"
                :class="['p-4 rounded-xl border-2 transition text-left',
                  sshForm.username === 'centos' 
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-lg' 
                    : 'bg-gray-900/50 border-gray-700 hover:border-indigo-500/50']"
              >
                <div class="font-semibold text-white mb-1">CentOS / Red Hat</div>
                <div class="text-xs text-gray-400">Use: <span class="text-green-400 font-mono">centos</span></div>
              </button>
            </div>
            
            <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start space-x-2">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-xs text-gray-300">
                <strong>Not sure?</strong> Most AWS servers use <code class="text-green-400 bg-gray-800 px-1 rounded">ec2-user</code>. Just click the button above!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Private Key -->
      <div class="bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-700/50">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
            2
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-bold text-white mb-2">Upload Your Security Key</h4>
            <p class="text-sm text-gray-400 mb-4">
              This is the <code class="text-green-400 bg-gray-800 px-1 rounded">.pem</code> file you downloaded when creating your AWS server.
            </p>
            
            <!-- File Upload Area -->
            <div
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
              :class="['border-2 border-dashed rounded-xl p-8 transition cursor-pointer',
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : sshForm.privateKey 
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-900/30 hover:border-indigo-500/50']"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pem,.key"
                @change="handleFileSelect"
                class="hidden"
              />
              
              <div class="text-center">
                <svg v-if="!sshForm.privateKey" class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <svg v-else class="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                
                <p class="text-white font-semibold mb-2">
                  {{ sshForm.privateKey ? '✅ Key File Loaded!' : '📁 Drop your .pem file here' }}
                </p>
                <p class="text-sm text-gray-400 mb-4">
                  {{ sshForm.privateKey ? 'Click to change file' : 'or click to browse your computer' }}
                </p>
                <button
                  type="button"
                  class="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition"
                >
                  {{ sshForm.privateKey ? 'Change File' : 'Browse Files' }}
                </button>
              </div>
            </div>
            
            <!-- Manual Paste Option -->
            <div class="mt-4">
              <button
                @click="showManualPaste = !showManualPaste"
                class="text-sm text-indigo-400 hover:text-indigo-300 underline"
              >
                {{ showManualPaste ? '❌ Hide manual paste' : '📝 Or paste the key manually (if you can\'t find the file)' }}
              </button>
              
              <div v-if="showManualPaste" class="mt-3">
                <textarea
                  v-model="sshForm.privateKey"
                  rows="8"
                  placeholder="Paste your private key content here...
It should start with: -----BEGIN RSA PRIVATE KEY-----
And end with: -----END RSA PRIVATE KEY-----"
                  class="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                ></textarea>
              </div>
            </div>
            
            <!-- Help Finding the File -->
            <div class="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p class="text-sm font-semibold text-yellow-400 mb-2">🔍 Can't find your .pem file?</p>
              <ol class="text-xs text-gray-300 space-y-1 ml-4 list-decimal">
                <li>Check your <strong>Downloads</strong> folder</li>
                <li>Look for a file ending in <code class="text-green-400 bg-gray-800 px-1 rounded">.pem</code></li>
                <li>The file name might be something like: <code class="text-green-400 bg-gray-800 px-1 rounded">my-aws-key.pem</code></li>
                <li>This file was downloaded when you first created your AWS server</li>
              </ol>
            </div>
            
            <!-- Security Notice -->
            <div class="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div class="flex items-start space-x-3">
                <svg class="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-green-400 mb-1">🔒 Your Key is 100% Safe</p>
                  <p class="text-xs text-gray-300">
                    We use military-grade encryption (same as banks) to protect your key. Nobody can see it - not even us. 
                    It's only used to connect to your server for logs. You can remove it anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Step: Save Button -->
      <div class="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
            ✓
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-bold text-white mb-2">Almost Done!</h4>
            <p class="text-sm text-gray-300 mb-4">
              Click the button below to save your settings and start watching logs.
            </p>
            
            <div class="flex space-x-3">
              <button
                @click="saveSSHCredentials"
                :disabled="!canSave || saving"
                class="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center space-x-3"
              >
                <svg v-if="!saving" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ saving ? 'Connecting to Your Server...' : '🚀 Save & Start Watching Logs!' }}</span>
              </button>
              
              <button
                @click="cancelSetup"
                class="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition"
              >
                Cancel
              </button>
            </div>
            
            <p v-if="!canSave" class="text-sm text-yellow-400 mt-3">
              ⚠️ Please complete Step 1 (Username) and Step 2 (Security Key) first
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Viewer (only if SSH is configured) -->
    <div v-if="sshConfigured" class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
      <!-- Help Section (Collapsible) -->
      <div class="mb-4 bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
        <button
          @click="showHelp = !showHelp"
          class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/30 transition"
        >
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium text-gray-300">Need help? Click here</span>
          </div>
          <svg 
            :class="['w-5 h-5 text-gray-400 transition-transform', showHelp ? 'rotate-180' : '']" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div v-if="showHelp" class="px-4 pb-4 space-y-4 text-sm text-gray-300">
          <div>
            <p class="font-semibold text-white mb-2">📋 What can you watch?</p>
            <ul class="space-y-1 ml-4">
              <li>• <strong>System Logs:</strong> What your server is doing</li>
              <li>• <strong>Login Attempts:</strong> Who tried to access your server</li>
              <li>• <strong>Website Logs:</strong> Who visited your website (Nginx/Apache)</li>
              <li>• <strong>Application Errors:</strong> If something goes wrong</li>
              <li>• <strong>Docker:</strong> Watch your containers' activity</li>
            </ul>
          </div>
          
          <div class="pt-3 border-t border-gray-700/50">
            <p class="font-semibold text-white mb-2">❌ Something not working?</p>
            <ul class="space-y-2 ml-4">
              <li>
                <strong class="text-yellow-400">Can't connect?</strong>
                <br/>
                <span class="text-xs text-gray-400">Check if your AWS Security Group allows SSH on port 22</span>
              </li>
              <li>
                <strong class="text-yellow-400">Wrong password error?</strong>
                <br/>
                <span class="text-xs text-gray-400">Make sure you used the right username (ec2-user or ubuntu)</span>
              </li>
              <li>
                <strong class="text-yellow-400">Log file not found?</strong>
                <br/>
                <span class="text-xs text-gray-400">Try a different log source - not all servers have all logs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h4 class="text-white font-semibold">Live Log Stream</h4>
        <div class="flex items-center space-x-3">
          <!-- Log Source Selector -->
          <select
            v-model="selectedLogSource"
            :disabled="isStreaming"
            class="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          >
            <option value="">Select log source...</option>
            <option v-for="source in logSources" :key="source.id" :value="source.id">
              {{ source.label }}
            </option>
          </select>

          <!-- Stream Controls -->
          <button
            v-if="!isStreaming"
            @click="startStreaming"
            :disabled="!selectedLogSource"
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start</span>
          </button>
          <button
            v-else
            @click="stopStreaming"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Stop</span>
          </button>

          <button
            @click="clearLogs"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Status Banner -->
      <div v-if="streamStatus" class="mb-4 px-4 py-2 rounded-lg flex items-center space-x-2" :class="{
        'bg-green-500/20 border border-green-500/50': streamStatus.type === 'success',
        'bg-blue-500/20 border border-blue-500/50': streamStatus.type === 'info',
        'bg-red-500/20 border border-red-500/50': streamStatus.type === 'error'
      }">
        <svg class="w-4 h-4" :class="{
          'text-green-400': streamStatus.type === 'success',
          'text-blue-400': streamStatus.type === 'info',
          'text-red-400': streamStatus.type === 'error'
        }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm" :class="{
          'text-green-400': streamStatus.type === 'success',
          'text-blue-400': streamStatus.type === 'info',
          'text-red-400': streamStatus.type === 'error'
        }">{{ streamStatus.message }}</span>
      </div>

      <!-- Log Output -->
      <div 
        ref="logContainer"
        class="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap"
      >
        <div v-if="logLines.length === 0" class="text-gray-500 text-center py-20">
          {{ isStreaming ? 'Waiting for log data...' : 'Select a log source and click Start to begin streaming' }}
        </div>
        <div v-for="(line, index) in logLines" :key="index" class="hover:bg-gray-800/50 py-0.5 px-2">
          {{ line }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import apiClient from '@/api/client';

const props = defineProps({
  server: {
    type: Object,
    required: true
  }
});

// SSH Configuration
const sshConfigured = ref(false);
const showSSHSetup = ref(false);
const showHelp = ref(false);
const showManualPaste = ref(false);
const isDragging = ref(false);
const saving = ref(false);
const sshForm = ref({
  username: 'ec2-user',
  port: 22,
  privateKey: ''
});

// Log Streaming
const selectedLogSource = ref('');
const logSources = ref([]);
const isStreaming = ref(false);
const logLines = ref([]);
const streamStatus = ref(null);
const logContainer = ref(null);
const fileInput = ref(null);
let ws = null;

// Computed
const setupProgress = computed(() => {
  let progress = 0;
  if (sshForm.value.username) progress += 33;
  if (sshForm.value.port === 22) progress += 33;
  if (sshForm.value.privateKey) progress += 34;
  return progress;
});

const canSave = computed(() => {
  return sshForm.value.username && sshForm.value.privateKey;
});

// File handling
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      sshForm.value.privateKey = e.target.result;
    };
    reader.readAsText(file);
  }
}

function handleFileDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && (file.name.endsWith('.pem') || file.name.endsWith('.key'))) {
    const reader = new FileReader();
    reader.onload = (e) => {
      sshForm.value.privateKey = e.target.result;
    };
    reader.readAsText(file);
  }
}

// Check SSH configuration status
async function checkSSHStatus() {
  try {
    const response = await apiClient.get(
      `/cloud-accounts/${props.server.cloudAccountId}/ssh/status`
    );
    
    if (response.data.success) {
      sshConfigured.value = response.data.configured;
      if (response.data.configured) {
        sshForm.value.username = response.data.sshUsername || 'ec2-user';
        sshForm.value.port = response.data.sshPort || 22;
      }
    }
  } catch (error) {
    console.error('Error checking SSH status:', error);
  }
}

// Save SSH credentials
async function saveSSHCredentials() {
  saving.value = true;
  try {
    const response = await apiClient.put(
      `/cloud-accounts/${props.server.cloudAccountId}/ssh`,
      {
        sshPrivateKey: sshForm.value.privateKey,
        sshUsername: sshForm.value.username,
        sshPort: sshForm.value.port
      }
    );
    
    if (response.data.success) {
      sshConfigured.value = true;
      showSSHSetup.value = false;
      sshForm.value.privateKey = ''; // Clear the form
      streamStatus.value = { type: 'success', message: 'SSH credentials saved successfully!' };
    }
  } catch (error) {
    console.error('Error saving SSH credentials:', error);
    streamStatus.value = { type: 'error', message: error.response?.data?.message || 'Failed to save SSH credentials' };
  } finally {
    saving.value = false;
  }
}

// Remove SSH credentials
async function removeSSHCredentials() {
  if (!confirm('Are you sure you want to remove SSH credentials? This will disable log streaming.')) {
    return;
  }
  
  try {
    const response = await apiClient.delete(
      `/cloud-accounts/${props.server.cloudAccountId}/ssh`
    );
    
    if (response.data.success) {
      sshConfigured.value = false;
      streamStatus.value = { type: 'success', message: 'SSH credentials removed successfully' };
    }
  } catch (error) {
    console.error('Error removing SSH credentials:', error);
    streamStatus.value = { type: 'error', message: 'Failed to remove SSH credentials' };
  }
}

function cancelSetup() {
  showSSHSetup.value = false;
  sshForm.value = {
    username: 'ec2-user',
    port: 22,
    privateKey: ''
  };
}

// WebSocket connection
function initializeWebSocket() {
  // Auto-detect WebSocket URL based on environment
  const getWebSocketUrl = () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'cloudevy.in' || hostname === 'www.cloudevy.in') {
      // Production - use secure WebSocket
      return 'wss://cloudevy.in/ws/logs';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development
      return 'ws://localhost:8002/ws/logs';
    } else {
      // Default to localhost for any other hostname
      return 'ws://localhost:8002/ws/logs';
    }
  };
  
  const wsUrl = getWebSocketUrl();
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    // Authenticate
    const token = localStorage.getItem('token');
    ws.send(JSON.stringify({ type: 'auth', token }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'connected':
        break;
      
      case 'auth_success':
        // Request available log sources
        ws.send(JSON.stringify({ type: 'get_log_sources' }));
        break;
      
      case 'log_sources':
        logSources.value = message.sources;
        break;
      
      case 'stream_started':
        isStreaming.value = true;
        streamStatus.value = { type: 'success', message: message.message };
        break;
      
      case 'log_data':
        logLines.value.push(message.data);
        // Auto-scroll to bottom
        nextTick(() => {
          if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight;
          }
        });
        break;
      
      case 'stream_stopped':
      case 'stream_closed':
        isStreaming.value = false;
        streamStatus.value = { type: 'info', message: message.message };
        break;
      
      case 'stream_error':
      case 'error':
        streamStatus.value = { type: 'error', message: message.message };
        break;
    }
  };
  
  ws.onerror = () => {
    streamStatus.value = { type: 'error', message: 'WebSocket connection error' };
  };
  
  ws.onclose = () => {
    isStreaming.value = false;
  };
}

// Start streaming logs
function startStreaming() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    streamStatus.value = { type: 'error', message: 'WebSocket not connected. Reconnecting...' };
    initializeWebSocket();
    return;
  }
  
  logLines.value = [];
  ws.send(JSON.stringify({
    type: 'start_stream',
    serverId: props.server.id,
    logSource: selectedLogSource.value
  }));
}

// Stop streaming logs
function stopStreaming() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stop_stream' }));
  }
  isStreaming.value = false;
}

// Clear log output
function clearLogs() {
  logLines.value = [];
}

// Lifecycle hooks
onMounted(() => {
  checkSSHStatus();
  if (sshConfigured.value) {
    initializeWebSocket();
  }
});

onBeforeUnmount(() => {
  if (ws) {
    stopStreaming();
    ws.close();
  }
});

// Watch for SSH configuration changes
watch(sshConfigured, (configured) => {
  if (configured && !ws) {
    initializeWebSocket();
  }
});
</script>
