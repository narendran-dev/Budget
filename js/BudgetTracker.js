export default class BudgetTracker {
  constructor(querySelectorString) {
    this.root = document.querySelector(querySelectorString);
    this.root.innerHTML = BudgetTracker.html();
    this.data = [];
    this.root.querySelector(".new-entry").addEventListener("click", () => {
      this.onNewEntryBtnClick();
    });

    this.chartCanvas = this.root.querySelector("#incomeExpenseChart");

    this.load();
  }

  getTotalIncome() {
    return this.data
      .filter((entry) => entry.type === "income")
      .reduce((acc, entry) => acc + entry.amount, 0);
  }

  getTotalExpense() {
    return this.data
      .filter((entry) => entry.type === "expense")
      .reduce((acc, entry) => acc + entry.amount, 0);
  }
  static html() {
    return `
            <table class="budget-tracker">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody class="entries"></tbody>
                <tbody>
                    <tr>
                        <td colspan="5" class="controls">
                            <button type="button" class="new-entry button">New Entry</button>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="summary">
                            <strong>Total:</strong>
                            <span class="total">$0.00</span>
                        </td>
                    </tr>
                </tfoot>
            </table>
            <canvas id="incomeExpenseChart" width="400" height="200"></canvas>

        `;
  }

  static entryHtml() {
    return `
            <tr>
                <td>
                    <input class="input input-date" type="date">
                </td>
                <td>
                    <input class="input input-description" type="text" placeholder="Add a Description (e.g. wages, bills, etc.)">
                </td>
                <td>
                    <select class="input input-type">
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="input input-amount">
                </td>
                <td>
                    <button type="button" class="delete-entry">&#10005;</button>
                </td>
            </tr>
        `;
  }

  load() {
    const entries = JSON.parse(localStorage.getItem("budget") || "[]");

    for (const entry of entries) {
      this.addEntry(entry);
    }
    this.updateSummary();
  }

  updateSummary() {
    const total = this.getEntryRows().reduce((total, row) => {
      const amount = row.querySelector(".input-amount").value;
      const isExpense = row.querySelector(".input-type").value === "expense";
      const modifier = isExpense ? -1 : 1;

      return total + amount * modifier;
    }, 0);

    const totalFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(total);

    this.root.querySelector(".total").textContent = totalFormatted;
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.chartCanvas, {
      options: {
        plugins: {
          colors: {
            enabled: true,
            // forceOverride: true
          },
        },
      },
      type: "bar",
      data: {
        labels: ["Income", "Expense"],
        datasets: [
          {
            label: "Amount",
            data: [this.getTotalIncome(), this.getTotalExpense()],
            backgroundColor: ["#dc13a069", "#36A2EB80"],
          },
        ],
      },
    });
  }

  save() {
    const data = this.getEntryRows().map((row) => {
      return {
        date: row.querySelector(".input-date").value,
        description: row.querySelector(".input-description").value,
        type: row.querySelector(".input-type").value,
        amount: parseFloat(row.querySelector(".input-amount").value),
      };
    });
    console.log(data);
    this.data = data;
    localStorage.setItem("budget", JSON.stringify(data));
    this.updateSummary();
  }

  addEntry(entry = {}) {
    this.data.push(entry);
    this.root
      .querySelector(".entries")
      .insertAdjacentHTML("beforeend", BudgetTracker.entryHtml());

    const row = this.root.querySelector(".entries tr:last-of-type");

    row.querySelector(".input-date").value =
      entry.date || new Date().toISOString().replace(/T.*/, "");
    row.querySelector(".input-description").value = entry.description || "";
    row.querySelector(".input-type").value = entry.type || "income";
    row.querySelector(".input-amount").value = entry.amount || 0;
    row.querySelector(".delete-entry").addEventListener("click", (e) => {
      this.onDeleteEntryBtnClick(e);
    });

    row.querySelectorAll(".input").forEach((input) => {
      input.addEventListener("change", () => this.save());
    });
  }

  getEntryRows() {
    return Array.from(this.root.querySelectorAll(".entries tr"));
  }

  onNewEntryBtnClick() {
    this.addEntry();
  }

  onDeleteEntryBtnClick(e) {
    e.target.closest("tr").remove();
    this.save();
  }
}
