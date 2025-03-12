// leaderboard-table-patch.js - Apply leaderboard spacing adjustments

(function() {
  // Create a style element
  const styleElement = document.createElement('style');
  
  // Add the CSS rules
  styleElement.textContent = `
    /* Make the leaderboard table 8% narrower */
    .leaderboard-table {
        max-width: 368px; /* Reduced from 400px (8% less) */
        width: 92%; /* 8% less than 100% */
    }

    /* Adjust the grid column widths with better spacing */
    .leaderboard-row {
        display: grid;
        grid-template-columns: 40px minmax(80px, 1fr) 70px 80px;
        column-gap: 10px; /* Add spacing between all columns */
        padding: 6px 8px;
        border-bottom: 1px solid #f3f4f6;
    }

    /* Push SCORE right */
    .leaderboard-cell.score {
        text-align: right;
        padding-right: 10px; /* Add extra padding on the right */
    }

    /* Push DATE further right */
    .leaderboard-cell.date {
        text-align: right;
        padding-right: 5px;
    }

    /* Make header text bold and properly aligned */
    .leaderboard-row.header {
        font-weight: bold;
    }

    .leaderboard-row.header .leaderboard-cell.rank {
        text-align: center;
    }

    .leaderboard-row.header .leaderboard-cell.name {
        text-align: left;
        padding-left: 5px;
    }

    /* Handle smaller screens */
    @media (max-width: 480px) {
        .leaderboard-table {
            max-width: 92%; /* Keep it proportionally smaller */
        }
        
        .leaderboard-row {
            grid-template-columns: 35px minmax(70px, 1fr) 60px 70px;
            column-gap: 8px;
            font-size: 0.8rem;
            padding: 6px;
        }
    }
  `;
  
  // Add the style element to the document head
  document.head.appendChild(styleElement);
  
  console.log('Leaderboard table spacing adjustments applied');
})();
