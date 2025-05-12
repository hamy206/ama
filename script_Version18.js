<script>
    const links = document.querySelectorAll('.nav-links a');
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
}
});
</script>
