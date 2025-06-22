
        // App State
        let appData = {
            accounts: {
                cash: 0,
                banks: [{ name: 'Primary Bank', balance: 0 }]
            },
            transactions: [],
            savingsGoals: [],
            wishlist: [],
            settings: {
                theme: 'light'
            }
        };

        let currentTransactionType = 'expense';

        // Initialize App
        function initApp() {
            loadData();
            updateDateTime();
            updateUI();
            
            // Check if setup is needed
            if (!localStorage.getItem('expenseTrackerSetup')) {
                document.getElementById('setupScreen').classList.add('show');
            } else {
                document.getElementById('setupScreen').classList.remove('show');
            }
            
            // Update datetime every minute
            setInterval(updateDateTime, 60000);
        }

        // Data Management
        function saveData() {
            localStorage.setItem('expenseTrackerData', JSON.stringify(appData));
        }

        function loadData() {
            const saved = localStorage.getItem('expenseTrackerData');
            if (saved) {
                appData = { ...appData, ...JSON.parse(saved) };
            }
            
            // Apply theme
            if (appData.settings.theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
            }
        }

        // Setup Functions
        function completeSetup() {
            const cashBalance = parseFloat(document.getElementById('cashBalance').value) || 0;
            const bankBalance = parseFloat(document.getElementById('bankBalance').value) || 0;
            const bankName = document.getElementById('bankName').value || 'Primary Bank';
            
            appData.accounts.cash = cashBalance;
            appData.accounts.banks[0] = { name: bankName, balance: bankBalance };
            
            localStorage.setItem('expenseTrackerSetup', 'true');
            saveData();
            
            document.getElementById('setupScreen').classList.remove('show');
            updateUI();
        }

        // UI Functions
        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
        }

        function switchSection(section) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            // Show selected section
            document.getElementById(section + 'Section').classList.add('active');
            event.target.closest('.nav-item').classList.add('active');
            
            // Update header title
            const titles = {
                home: 'Today',
                dashboard: 'Dashboard', 
                savings: 'Savings',
                wishlist: 'Wishlist',
                profile: 'Profile'
            };
            document.getElementById('sectionTitle').textContent = titles[section];
            
            // Update specific sections
            if (section === 'dashboard') updateDashboard();
            if (section === 'savings') updateSavings();
            if (section === 'wishlist') updateWishlist();
            if (section === 'profile') updateProfile();
        }

        function toggleTheme() {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            appData.settings.theme = newTheme;
            saveData();
            
            // Update toggle button
            const toggleBtn = document.querySelector('.theme-toggle');
            toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }

        // Transaction Functions
        function showExpenseForm(type) {
            currentTransactionType = type;
            const form = document.getElementById('expenseForm');
            const title = document.getElementById('formTitle');
            const submitBtn = document.getElementById('submitBtn');
            
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('transactionDate').value = today;
            
            if (type === 'income') {
                title.textContent = 'Add Income';
                submitBtn.textContent = 'Add Income';
                submitBtn.className = 'btn';
                submitBtn.style.background = 'var(--accent-color)';
            } else {
                title.textContent = 'Add Expense';
                submitBtn.textContent = 'Add Expense';
                submitBtn.className = 'btn';
                submitBtn.style.background = 'var(--primary-color)';
            }
            
            form.classList.add('show');
        }

        function hideExpenseForm() {
            document.getElementById('expenseForm').classList.remove('show');
            document.getElementById('transactionForm').reset();
        }

        function addTransaction(event) {
            event.preventDefault();
            
            const amountStr = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            const paymentMode = document.getElementById('paymentMode').value;
            const category = document.getElementById('category').value;
            const selectedDate = document.getElementById('transactionDate').value;
            
            // Calculate amount (support basic math)
            let amount;
            try {
                amount = eval(amountStr.replace(/[^0-9+\-*/.() ]/g, ''));
                amount = parseFloat(amount);
            } catch {
                amount = parseFloat(amountStr) || 0;
            }
            
            if (amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            if (!selectedDate) {
                alert('Please select a date');
                return;
            }
            
            const transaction = {
                id: Date.now(),
                type: currentTransactionType,
                amount: amount,
                description: description,
                paymentMode: paymentMode,
                category: category,
                date: selectedDate, // Use selected date instead of current date
                timestamp: Date.now()
            };
            
            // Update balances
            if (currentTransactionType === 'expense') {
                if (paymentMode === 'cash') {
                    appData.accounts.cash -= amount;
                } else {
                    // Use the first available bank account for now
                    if (appData.accounts.banks.length > 0) {
                        appData.accounts.banks[0].balance -= amount;
                    }
                }
            } else {
                if (paymentMode === 'cash') {
                    appData.accounts.cash += amount;
                } else {
                    // Use the first available bank account for now
                    if (appData.accounts.banks.length > 0) {
                        appData.accounts.banks[0].balance += amount;
                    }
                }
            }
            
            appData.transactions.push(transaction);
            saveData();
            updateUI();
            hideExpenseForm();
        }

        // Calculate Functions
        function getTodayTransactions() {
            const today = new Date().toISOString().split('T')[0];
            return appData.transactions.filter(t => {
                // Handle both old format (ISO string) and new format (YYYY-MM-DD)
                if (t.date.includes('T')) {
                    return new Date(t.date).toISOString().split('T')[0] === today;
                }
                return t.date === today;
            });
        }

        function getMonthlyTransactions() {
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
            return appData.transactions.filter(t => {
                // Handle both old format (ISO string) and new format (YYYY-MM-DD)
                if (t.date.includes('T')) {
                    return new Date(t.date).toISOString().slice(0, 7) === currentMonth;
                }
                return t.date.slice(0, 7) === currentMonth;
            });
        }

        function calculateTotals() {
            const todayTrans = getTodayTransactions();
            const monthlyTrans = getMonthlyTransactions();
            
            const todayExpenses = todayTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const todayIncome = todayTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const monthlyExpenses = monthlyTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const monthlyIncome = monthlyTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            return {
                todayExpenses,
                todayIncome,
                monthlyExpenses,
                monthlyIncome
            };
        }

        // Update UI Functions
        function updateUI() {
            const totals = calculateTotals();
            
            // Update balance overview
            document.getElementById('todayExpenses').textContent = `₹${totals.todayExpenses.toFixed(2)}`;
            document.getElementById('todayIncome').textContent = `₹${totals.todayIncome.toFixed(2)}`;
            document.getElementById('netToday').textContent = `₹${(totals.todayIncome - totals.todayExpenses).toFixed(2)}`;
            document.getElementById('cashAvailable').textContent = `₹${appData.accounts.cash.toFixed(2)}`;
            document.getElementById('bankAvailable').textContent = `₹${appData.accounts.banks[0].balance.toFixed(2)}`;
            
            // Update monthly summary
            document.getElementById('monthlyExpenses').textContent = `₹${totals.monthlyExpenses.toFixed(2)}`;
            document.getElementById('monthlyIncome').textContent = `₹${totals.monthlyIncome.toFixed(2)}`;
            document.getElementById('monthlyNet').textContent = `₹${(totals.monthlyIncome - totals.monthlyExpenses).toFixed(2)}`;
            
            // Update net today color
            const netToday = totals.todayIncome - totals.todayExpenses;
            const netTodayEl = document.getElementById('netToday');
            netTodayEl.className = `balance-amount ${netToday >= 0 ? 'positive' : 'negative'}`;
            
            // Update monthly net color
            const monthlyNet = totals.monthlyIncome - totals.monthlyExpenses;
            const monthlyNetEl = document.getElementById('monthlyNet');
            monthlyNetEl.className = `balance-amount ${monthlyNet >= 0 ? 'positive' : 'negative'}`;
            
            updateRecentTransactions();
        }

        function updateRecentTransactions() {
            const container = document.getElementById('recentTransactions');
            const recent = appData.transactions
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);
            
            if (recent.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No transactions yet</p>';
                return;
            }
            
            container.innerHTML = recent.map(t => {
                // Format date properly for both old and new formats
                let displayDate;
                if (t.date.includes('T')) {
                    displayDate = new Date(t.date).toLocaleDateString();
                } else {
                    displayDate = new Date(t.date + 'T00:00:00').toLocaleDateString();
                }
                
                return `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <div class="transaction-title">${t.description}</div>
                            <div class="transaction-meta">${t.category} • ${t.paymentMode} • ${displayDate}</div>
                        </div>
                        <div class="transaction-amount ${t.type === 'expense' ? 'negative' : 'positive'}">
                            ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function updateDashboard() {
            updateDashboardStats();
            updateFinancialOverview();
            updateCategoryBreakdown();
            updateSpendingTrends();
            updateGoalsProgress();
            updateMonthlyComparison();
        }

        function updateDashboardStats() {
            const totals = calculateTotals();
            const totalBalance = appData.accounts.cash + appData.accounts.banks.reduce((sum, bank) => sum + bank.balance, 0);
            const monthlyNet = totals.monthlyIncome - totals.monthlyExpenses;
            
            // Calculate average savings progress
            let avgProgress = 0;
            if (appData.savingsGoals.length > 0) {
                const totalProgress = appData.savingsGoals.reduce((sum, goal) => {
                    return sum + (goal.saved / goal.target) * 100;
                }, 0);
                avgProgress = totalProgress / appData.savingsGoals.length;
            }
            
            document.getElementById('dashTotalBalance').textContent = `₹${totalBalance.toFixed(0)}`;
            document.getElementById('dashMonthlyNet').textContent = `₹${monthlyNet.toFixed(0)}`;
            document.getElementById('dashSavingsProgress').textContent = `${avgProgress.toFixed(1)}%`;
            document.getElementById('dashTransactionsCount').textContent = appData.transactions.length.toString();
            
            // Update colors based on values
            const balanceEl = document.getElementById('dashTotalBalance');
            const netEl = document.getElementById('dashMonthlyNet');
            
            balanceEl.style.color = totalBalance >= 0 ? 'var(--accent-color)' : 'var(--danger-color)';
            netEl.style.color = monthlyNet >= 0 ? 'var(--accent-color)' : 'var(--danger-color)';
        }

        function updateFinancialOverview() {
            const container = document.getElementById('financialOverview');
            const totals = calculateTotals();
            const totalBalance = appData.accounts.cash + appData.accounts.banks.reduce((sum, bank) => sum + bank.balance, 0);
            const avgDailyExpense = totals.monthlyExpenses / new Date().getDate();
            
            container.innerHTML = `
                <div class="balance-item">
                    <span class="balance-label">💰 Total Balance</span>
                    <span class="balance-amount ${totalBalance >= 0 ? 'positive' : 'negative'}">₹${totalBalance.toFixed(2)}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📈 Monthly Income</span>
                    <span class="balance-amount positive">₹${totals.monthlyIncome.toFixed(2)}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📉 Monthly Expenses</span>
                    <span class="balance-amount negative">₹${totals.monthlyExpenses.toFixed(2)}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📊 Avg Daily Spending</span>
                    <span class="balance-amount">₹${avgDailyExpense.toFixed(2)}</span>
                </div>
            `;
        }

        function updateGoalsProgress() {
            const container = document.getElementById('goalsProgress');
            
            if (appData.savingsGoals.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No savings goals set yet</p>';
                return;
            }
            
            container.innerHTML = appData.savingsGoals.slice(0, 3).map(goal => {
                const progress = (goal.saved / goal.target) * 100;
                return `
                    <div class="balance-item">
                        <span class="balance-label">🎯 ${goal.name}</span>
                        <span class="balance-amount">${progress.toFixed(1)}%</span>
                    </div>
                    <div style="background: var(--border-color); height: 8px; border-radius: 4px; margin-bottom: 1rem;">
                        <div style="background: var(--accent-color); height: 100%; width: ${Math.min(progress, 100)}%; border-radius: 4px;"></div>
                    </div>
                `;
            }).join('');
        }

        function updateMonthlyComparison() {
            const container = document.getElementById('monthlyComparison');
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStr = lastMonth.toISOString().slice(0, 7);
            
            const currentMonthTrans = getMonthlyTransactions();
            const lastMonthTrans = appData.transactions.filter(t => {
                // Handle both old format (ISO string) and new format (YYYY-MM-DD)
                if (t.date.includes('T')) {
                    return new Date(t.date).toISOString().slice(0, 7) === lastMonthStr;
                }
                return t.date.slice(0, 7) === lastMonthStr;
            });
            
            const currentExpenses = currentMonthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const lastExpenses = lastMonthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const difference = currentExpenses - lastExpenses;
            const percentChange = lastExpenses > 0 ? ((difference / lastExpenses) * 100).toFixed(1) : 0;
            
            container.innerHTML = `
                <div class="balance-item">
                    <span class="balance-label">📅 This Month</span>
                    <span class="balance-amount negative">₹${currentExpenses.toFixed(2)}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📅 Last Month</span>
                    <span class="balance-amount negative">₹${lastExpenses.toFixed(2)}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📊 Change</span>
                    <span class="balance-amount ${difference >= 0 ? 'negative' : 'positive'}">
                        ${difference >= 0 ? '+' : ''}₹${difference.toFixed(2)} (${percentChange}%)
                    </span>
                </div>
            `;
        }

        function updateCategoryBreakdown() {
            const container = document.getElementById('categoryBreakdown');
            const monthlyTrans = getMonthlyTransactions().filter(t => t.type === 'expense');
            
            if (monthlyTrans.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No expenses this month</p>';
                return;
            }
            
            const categoryTotals = {};
            monthlyTrans.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });
            
            const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
            
            container.innerHTML = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                    const categoryIcons = {
                        food: '🍕', travel: '🚗', groceries: '🛒', entertainment: '🎬',
                        utilities: '💡', healthcare: '🏥', shopping: '🛍️', salary: '💼',
                        freelance: '💻', investment: '📈', savings: '💰', other: '📋'
                    };
                    
                    return `
                        <div class="balance-item">
                            <span class="balance-label">${categoryIcons[category] || '📋'} ${category}</span>
                            <span class="balance-amount negative">₹${amount.toFixed(2)} (${percentage}%)</span>
                        </div>
                        <div style="background: var(--border-color); height: 6px; border-radius: 3px; margin-bottom: 1rem;">
                            <div style="background: var(--primary-color); height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
                        </div>
                    `;
                }).join('');
        }

        function updateSpendingTrends() {
            const container = document.getElementById('spendingTrends');
            const last7Days = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayTransactions = appData.transactions.filter(t => {
                    // Handle both old format (ISO string) and new format (YYYY-MM-DD)
                    let transactionDate;
                    if (t.date.includes('T')) {
                        transactionDate = new Date(t.date).toISOString().split('T')[0];
                    } else {
                        transactionDate = t.date;
                    }
                    return transactionDate === dateStr && t.type === 'expense';
                });
                
                const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
                last7Days.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    amount: dayTotal
                });
            }
            
            const maxAmount = Math.max(...last7Days.map(d => d.amount), 1);
            
            container.innerHTML = last7Days.map(day => {
                const percentage = (day.amount / maxAmount) * 100;
                return `
                    <div class="balance-item">
                        <span class="balance-label">${day.date}</span>
                        <span class="balance-amount negative">₹${day.amount.toFixed(2)}</span>
                    </div>
                    <div style="background: var(--border-color); height: 4px; border-radius: 2px; margin-bottom: 0.5rem;">
                        <div style="background: var(--danger-color); height: 100%; width: ${percentage}%; border-radius: 2px;"></div>
                    </div>
                `;
            }).join('');
        }

        function updateSavings() {
            const container = document.getElementById('savingsGoals');
            
            if (appData.savingsGoals.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 1rem;">No savings goals yet</p>';
                return;
            }
            
            container.innerHTML = appData.savingsGoals.map(goal => {
                const progress = (goal.saved / goal.target) * 100;
                const remaining = Math.max(goal.target - goal.saved, 0);
                const isCompleted = progress >= 100;
                
                return `
                    <div class="transaction-item ${isCompleted ? 'completed-goal' : ''}" style="margin-top: 1rem;">
                        <div class="transaction-details">
                            <div class="transaction-title">${isCompleted ? '🎉 ' : ''}${goal.name}${isCompleted ? ' (Completed!)' : ''}</div>
                            <div class="transaction-meta">₹${goal.saved.toFixed(2)} / ₹${goal.target.toFixed(2)} (${progress.toFixed(1)}%)</div>
                            ${!isCompleted ? `<div class="transaction-meta" style="color: var(--accent-color);">₹${remaining.toFixed(2)} remaining</div>` : ''}
                            <div style="background: var(--border-color); height: 6px; border-radius: 3px; margin-top: 0.5rem;">
                                <div style="background: ${isCompleted ? '#10b981' : 'var(--accent-color)'}; height: 100%; width: ${Math.min(progress, 100)}%; border-radius: 3px;"></div>
                            </div>
                            <div style="margin-top: 0.5rem;">
                                ${!isCompleted ? `<button onclick="showAddMoneyForm(${goal.id})" style="background: var(--accent-color); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer; margin-right: 0.5rem;">💰 Add Money</button>` : ''}
                                <button onclick="deleteSavingsGoal(${goal.id})" style="background: var(--danger-color); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">✖ Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function updateWishlist() {
            const container = document.getElementById('wishlistItems');
            
            if (appData.wishlist.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 1rem;">No wishlist items yet</p>';
                return;
            }
            
            // Sort by priority (High -> Medium -> Low)
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const sortedWishlist = appData.wishlist.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            
            container.innerHTML = sortedWishlist.map(item => {
                const priorityIcons = { 'High': '🔥', 'Medium': '⚡', 'Low': '❄️' };
                const priorityColors = { 'High': 'var(--danger-color)', 'Medium': 'var(--warning-color)', 'Low': 'var(--info-color)' };
                
                return `
                    <div class="transaction-item" style="margin-top: 1rem;">
                        <div class="transaction-details">
                            <div class="transaction-title">${item.name}</div>
                            <div class="transaction-meta">₹${item.price.toFixed(2)} • <span style="color: ${priorityColors[item.priority]}">${priorityIcons[item.priority]} ${item.priority}</span></div>
                            ${item.targetDate ? `<div class="transaction-meta">🎯 Target: ${new Date(item.targetDate).toLocaleDateString()}</div>` : ''}
                        </div>
                        <button onclick="deleteWishlistItem(${item.id})" style="background: var(--danger-color); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">✖</button>
                    </div>
                `;
            }).join('');
        }

        function updateProfile() {
            const container = document.getElementById('accountSummary');
            const totalBalance = appData.accounts.cash + appData.accounts.banks.reduce((sum, bank) => sum + bank.balance, 0);
            const totalTransactions = appData.transactions.length;
            const totalSavingsGoals = appData.savingsGoals.length;
            const totalWishlistItems = appData.wishlist.length;
            
            container.innerHTML = `
                <div class="balance-item">
                    <span class="balance-label">💵 Total Cash</span>
                    <span class="balance-amount">₹${appData.accounts.cash.toFixed(2)}</span>
                </div>
                ${appData.accounts.banks.map(bank => `
                    <div class="balance-item">
                        <span class="balance-label">🏦 ${bank.name}</span>
                        <span class="balance-amount">₹${bank.balance.toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="balance-item">
                    <span class="balance-label"><strong>💰 Total Balance</strong></span>
                    <span class="balance-amount"><strong>₹${totalBalance.toFixed(2)}</strong></span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">📊 Total Transactions</span>
                    <span class="balance-amount">${totalTransactions}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">🎯 Savings Goals</span>
                    <span class="balance-amount">${totalSavingsGoals}</span>
                </div>
                <div class="balance-item">
                    <span class="balance-label">🛍️ Wishlist Items</span>
                    <span class="balance-amount">${totalWishlistItems}</span>
                </div>
            `;
        }

        // Modal Functions
        function showSavingsForm() {
            document.getElementById('savingsForm').classList.add('show');
        }

        function hideSavingsForm() {
            document.getElementById('savingsForm').classList.remove('show');
            document.getElementById('savingsGoalForm').reset();
        }

        function addSavingsGoal(event) {
            event.preventDefault();
            
            const name = document.getElementById('goalName').value;
            const target = parseFloat(document.getElementById('targetAmount').value);
            const saved = parseFloat(document.getElementById('savedAmount').value) || 0;
            
            const goal = {
                id: Date.now(),
                name: name,
                target: target,
                saved: saved
            };
            
            appData.savingsGoals.push(goal);
            saveData();
            updateSavings();
            hideSavingsForm();
        }

        function showWishlistForm() {
            document.getElementById('wishlistForm').classList.add('show');
        }

        function hideWishlistForm() {
            document.getElementById('wishlistForm').classList.remove('show');
            document.getElementById('wishlistItemForm').reset();
        }

        function addWishlistItem(event) {
            event.preventDefault();
            
            const name = document.getElementById('itemName').value;
            const price = parseFloat(document.getElementById('itemPrice').value);
            const priority = document.getElementById('itemPriority').value;
            const targetDate = document.getElementById('targetDate').value;
            
            const item = {
                id: Date.now(),
                name: name,
                price: price,
                priority: priority,
                targetDate: targetDate || null
            };
            
            appData.wishlist.push(item);
            saveData();
            updateWishlist();
            hideWishlistForm();
        }

        let currentSavingsGoalId = null;

        function showAddMoneyForm(goalId) {
            currentSavingsGoalId = goalId;
            const goal = appData.savingsGoals.find(g => g.id === goalId);
            document.getElementById('addMoneyTitle').textContent = `Add Money to ${goal.name}`;
            document.getElementById('addMoneyForm').classList.add('show');
        }

        function hideAddMoneyForm() {
            document.getElementById('addMoneyForm').classList.remove('show');
            document.getElementById('addMoneyToGoalForm').reset();
            currentSavingsGoalId = null;
        }

        function addMoneyToGoal(event) {
            event.preventDefault();
            
            const amount = parseFloat(document.getElementById('moneyAmount').value);
            const source = document.getElementById('moneySource').value;
            
            if (!currentSavingsGoalId) return;
            
            // Update goal
            const goal = appData.savingsGoals.find(g => g.id === currentSavingsGoalId);
            goal.saved += amount;
            
            // Update account balance
            if (source === 'cash') {
                appData.accounts.cash -= amount;
            } else {
                appData.accounts.banks[0].balance -= amount;
            }
            
            // Add transaction record
            const transaction = {
                id: Date.now(),
                type: 'expense',
                amount: amount,
                description: `Savings: ${goal.name}`,
                paymentMode: source,
                category: 'savings',
                date: new Date().toISOString().split('T')[0], // Use YYYY-MM-DD format
                timestamp: Date.now(),
                goalId: currentSavingsGoalId
            };
            
            appData.transactions.push(transaction);
            saveData();
            updateUI();
            updateSavings();
            hideAddMoneyForm();
        }

        function showAllTransactions() {
            document.getElementById('allTransactionsModal').classList.add('show');
            displayAllTransactions();
        }

        function hideAllTransactions() {
            document.getElementById('allTransactionsModal').classList.remove('show');
        }

        function displayAllTransactions() {
            const container = document.getElementById('allTransactionsList');
            const filter = document.getElementById('transactionFilter').value;
            
            let transactions = appData.transactions;
            if (filter !== 'all') {
                transactions = appData.transactions.filter(t => t.type === filter);
            }
            
            if (transactions.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions found</p>';
                return;
            }
            
            // Sort by date (newest first)
            transactions.sort((a, b) => b.timestamp - a.timestamp);
            
            container.innerHTML = transactions.map(t => {
                const categoryIcons = {
                    food: '🍕', travel: '🚗', groceries: '🛒', entertainment: '🎬',
                    utilities: '💡', healthcare: '🏥', shopping: '🛍️', salary: '💼',
                    freelance: '💻', investment: '📈', savings: '💰', other: '📋'
                };
                
                // Format date properly for both old and new formats
                let displayDate;
                if (t.date.includes('T')) {
                    displayDate = new Date(t.date).toLocaleDateString();
                } else {
                    displayDate = new Date(t.date + 'T00:00:00').toLocaleDateString();
                }
                
                return `
                    <div class="transaction-item" style="margin-bottom: 0.5rem;">
                        <div class="transaction-details">
                            <div class="transaction-title">${categoryIcons[t.category] || '📋'} ${t.description}</div>
                            <div class="transaction-meta">${t.category} • ${t.paymentMode} • ${displayDate}</div>
                        </div>
                        <div class="transaction-amount ${t.type === 'expense' ? 'negative' : 'positive'}">
                            ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function filterTransactions() {
            displayAllTransactions();
        }

        function searchAndFilterTransactions() {
            const query = document.getElementById('transactionSearch').value;
            const filter = document.getElementById('transactionFilter').value;
            
            let transactions = searchTransactions(query);
            if (filter !== 'all') {
                transactions = transactions.filter(t => t.type === filter);
            }
            
            displayFilteredTransactions(transactions);
        }

        function displayFilteredTransactions(transactions) {
            const container = document.getElementById('allTransactionsList');
            
            if (transactions.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions found</p>';
                return;
            }
            
            // Sort by date (newest first)
            transactions.sort((a, b) => b.timestamp - a.timestamp);
            
            container.innerHTML = transactions.map(t => {
                const categoryIcons = {
                    food: '🍕', travel: '🚗', groceries: '🛒', entertainment: '🎬',
                    utilities: '💡', healthcare: '🏥', shopping: '🛍️', salary: '💼',
                    freelance: '💻', investment: '📈', savings: '💰', other: '📋'
                };
                
                // Format date properly for both old and new formats
                let displayDate;
                if (t.date.includes('T')) {
                    displayDate = new Date(t.date).toLocaleDateString();
                } else {
                    displayDate = new Date(t.date + 'T00:00:00').toLocaleDateString();
                }
                
                return `
                    <div class="transaction-item" style="margin-bottom: 0.5rem;">
                        <div class="transaction-details">
                            <div class="transaction-title">${categoryIcons[t.category] || '📋'} ${t.description}</div>
                            <div class="transaction-meta">${t.category} • ${t.paymentMode} • ${displayDate}</div>
                        </div>
                        <div class="transaction-amount ${t.type === 'expense' ? 'negative' : 'positive'}">
                            ${t.type === 'expense' ? '-' : '+'}₹${t.amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function showAccountsManager() {
            document.getElementById('manageAccountsModal').classList.add('show');
            updateExistingAccountsList();
        }

        function hideAccountsManager() {
            document.getElementById('manageAccountsModal').classList.remove('show');
        }

        function updateExistingAccountsList() {
            const container = document.getElementById('existingAccountsList');
            
            let accountsHtml = `
                <div class="balance-item">
                    <span class="balance-label">💵 Cash Account</span>
                    <span class="balance-amount">₹${appData.accounts.cash.toFixed(2)}</span>
                </div>
            `;
            
            accountsHtml += appData.accounts.banks.map((bank, index) => `
                <div class="balance-item">
                    <span class="balance-label">🏦 ${bank.name}</span>
                    <span class="balance-amount">₹${bank.balance.toFixed(2)}</span>
                    ${appData.accounts.banks.length > 1 ? 
                        `<button onclick="deleteAccount(${index})" style="background: var(--danger-color); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer; margin-left: 0.5rem;">✖</button>`
                        : ''
                    }
                </div>
            `).join('');
            
            container.innerHTML = accountsHtml;
        }

        function addNewAccount(event) {
            event.preventDefault();
            
            const name = document.getElementById('newAccountName').value;
            const balance = parseFloat(document.getElementById('newAccountBalance').value);
            
            appData.accounts.banks.push({
                name: name,
                balance: balance
            });
            
            saveData();
            updateExistingAccountsList();
            updateUI();
            document.getElementById('addAccountForm').reset();
        }

        function deleteAccount(index) {
            if (appData.accounts.banks.length <= 1) {
                alert('Cannot delete the last bank account. You must have at least one bank account.');
                return;
            }
            
            const account = appData.accounts.banks[index];
            if (account.balance > 0) {
                if (!confirm(`This account has ₹${account.balance.toFixed(2)} balance. Deleting will lose this amount. Continue?`)) {
                    return;
                }
            }
            
            appData.accounts.banks.splice(index, 1);
            saveData();
            updateExistingAccountsList();
            updateUI();
        }

        function downloadApp() {
            // Create a blob with the current HTML content
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'index.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('📁 App downloaded successfully! You can open the HTML file in any browser.');
        }

        // Download JS Function
        function downloadJS() {
            // Extract JavaScript content from the current document
            const scripts = document.querySelectorAll('script');
            let jsContent = '';
            
            // Get the main script content (the large inline script)
            scripts.forEach(script => {
                if (script.innerHTML && script.innerHTML.trim().length > 1000) {
                    jsContent += script.innerHTML;
                }
            });
            
            if (!jsContent) {
                jsContent = `// ExpenseTracker JavaScript Code
// This file contains the extracted JavaScript from the ExpenseTracker app

// Note: This JS file requires the corresponding HTML structure to function properly
// Use this for reference or to understand the app's logic

${document.querySelector('script:not([src])').innerHTML}`;
            }
            
            const blob = new Blob([jsContent], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'expense-tracker.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('🗃️ JavaScript file downloaded successfully!');
        }

        function deleteSavingsGoal(id) {
            if (confirm('Delete this savings goal?')) {
                appData.savingsGoals = appData.savingsGoals.filter(g => g.id !== id);
                saveData();
                updateSavings();
            }
        }

        function deleteWishlistItem(id) {
            if (confirm('Remove this item from wishlist?')) {
                appData.wishlist = appData.wishlist.filter(i => i.id !== id);
                saveData();
                updateWishlist();
            }
        }

        function resetApp() {
            if (confirm('⚠️ Are you sure? This will delete all your data and reset the app. This action cannot be undone.')) {
                if (confirm('🔄 Final confirmation: All transactions, goals, and account data will be permanently deleted. Continue?')) {
                    // Auto-export data before reset
                    try {
                        exportData('pre-reset-backup');
                        alert('📤 Data automatically exported as backup before reset!');
                    } catch (error) {
                        console.error('Auto-export failed:', error);
                    }
                    
                    // Small delay to ensure download starts
                    setTimeout(() => {
                        localStorage.clear();
                        location.reload();
                    }, 1000);
                }
            }
        }

        // Export Data Function
        function exportData(filenameSuffix = '') {
            const exportData = {
                appData: appData,
                exportDate: new Date().toISOString(),
                version: '2.0',
                source: 'ExpenseTracker'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            const suffix = filenameSuffix ? `-${filenameSuffix}` : '';
            a.download = `expense-tracker-backup-${timestamp}${suffix}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (!filenameSuffix) {
                alert('📤 Data exported successfully! Save this file safely.');
            }
        }

        // Show Import Modal
        function showImportModal() {
            document.getElementById('importDataModal').classList.add('show');
        }

        // Hide Import Modal
        function hideImportModal() {
            document.getElementById('importDataModal').classList.remove('show');
            document.getElementById('importFile').value = '';
            document.getElementById('mergeData').checked = false;
        }

        // Import Data Function
        function importData() {
            const fileInput = document.getElementById('importFile');
            const mergeMode = document.getElementById('mergeData').checked;
            
            if (!fileInput.files.length) {
                alert('Please select a file to import');
                return;
            }
            
            const file = fileInput.files[0];
            
            if (!file.name.endsWith('.json')) {
                alert('Please select a valid JSON backup file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate the imported data structure
                    if (!importedData.appData || !importedData.source === 'ExpenseTracker') {
                        alert('Invalid backup file format');
                        return;
                    }
                    
                    // Create backup of current data before import
                    exportData('pre-import-backup');
                    
                    if (mergeMode) {
                        // Merge data
                        mergeImportedData(importedData.appData);
                        alert('📥 Data merged successfully! Previous data backed up.');
                    } else {
                        // Replace all data
                        appData = importedData.appData;
                        alert('📥 Data imported successfully! Previous data backed up.');
                    }
                    
                    saveData();
                    updateUI();
                    hideImportModal();
                    
                } catch (error) {
                    console.error('Import error:', error);
                    alert('Error importing data. Please check the file format.');
                }
            };
            
            reader.readAsText(file);
        }

        // Merge imported data with existing data
        function mergeImportedData(importedAppData) {
            // Merge transactions (avoid duplicates by checking timestamp)
            const existingTimestamps = new Set(appData.transactions.map(t => t.timestamp));
            const newTransactions = importedAppData.transactions.filter(t => !existingTimestamps.has(t.timestamp));
            appData.transactions.push(...newTransactions);
            
            // Merge savings goals (avoid duplicates by name)
            const existingGoalNames = new Set(appData.savingsGoals.map(g => g.name));
            const newGoals = importedAppData.savingsGoals.filter(g => !existingGoalNames.has(g.name));
            appData.savingsGoals.push(...newGoals);
            
            // Merge wishlist (avoid duplicates by name)
            const existingWishlistNames = new Set(appData.wishlist.map(w => w.name));
            const newWishlistItems = importedAppData.wishlist.filter(w => !existingWishlistNames.has(w.name));
            appData.wishlist.push(...newWishlistItems);
            
            // For accounts, we'll keep the current accounts to avoid confusion
            // Users can manually adjust balances if needed
        }

        // Auto-save functionality
        function autoSave() {
            saveData();
        }

        // Backup functionality
        function createBackup() {
            const backup = {
                data: appData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Enhanced error handling
        function handleError(error, context) {
            console.error(`Error in ${context}:`, error);
            // You could add user notification here
        }

        // Validation functions
        function validateTransaction(transaction) {
            return transaction.amount > 0 && 
                   transaction.description && 
                   transaction.category && 
                   transaction.paymentMode;
        }

        function validateAccount(account) {
            return account.name && 
                   typeof account.balance === 'number' && 
                   account.balance >= 0;
        }

        // Enhanced search functionality for transactions
        function searchTransactions(query) {
            if (!query) return appData.transactions;
            
            const lowerQuery = query.toLowerCase();
            return appData.transactions.filter(t => 
                t.description.toLowerCase().includes(lowerQuery) ||
                t.category.toLowerCase().includes(lowerQuery) ||
                t.paymentMode.toLowerCase().includes(lowerQuery)
            );
        }

        // Initialize app when page loads
        document.addEventListener('DOMContentLoaded', initApp);
    
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));
}